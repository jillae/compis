import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instruction, repoOwner, repoName, branch } = await req.json();
    
    console.log("DA-Agent received instruction:", instruction);

    // 1. Call Abacus AI API for code response
    const aiResponse = await callAbacusAI(instruction);
    console.log("AI Response received");

    // 2. Parse response for file changes
    const fileChanges = parseCodeResponse(aiResponse);
    console.log("Parsed file changes:", fileChanges.length);

    if (fileChanges.length === 0) {
      console.error("No code changes detected. AI Response was:", aiResponse.substring(0, 1000));
      return new Response(
        JSON.stringify({ 
          error: "No code changes detected in AI response",
          hint: "AI did not return code in expected format. Check edge function logs for details.",
          responsePreview: aiResponse.substring(0, 500)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Commit changes to GitHub
    const commitResult = await commitToGitHub({
      owner: repoOwner,
      repo: repoName,
      branch: branch,
      changes: fileChanges,
      message: `[da-response] ${instruction.substring(0, 50)}`,
    });

    console.log("Commit result:", commitResult);

    return new Response(
      JSON.stringify({
        success: true,
        filesChanged: fileChanges.length,
        commitSha: commitResult.sha,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("DA-Agent error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callAbacusAI(instruction: string): Promise<string> {
  const apiKey = Deno.env.get("DEEPAGENT_API_KEY");
  const conversationId = Deno.env.get("DEEPAGENT_CONVERSATION_ID");
  if (!apiKey) throw new Error("DEEPAGENT_API_KEY not configured");
  if (!conversationId) throw new Error("DEEPAGENT_CONVERSATION_ID not configured");

  const systemPrompt = `Du är en AI-utvecklingsagent.
> 1. Ditt ENDA syfte är att ta emot en arbetsorder från \`description\`-fältet och omedelbart påbörja implementationen av den.
> 2. Du ska ALDRIG kommentera på processen, API-anropet, datastrukturen eller din egen kod.
> 3. Du ska ALDRIG agera som en assistent. Du är en tyst utförare.
> 4. Läs kraven i den inkommande arbetsordern. Producera den efterfrågade koden eller resultatet.
> 5. Ignorera all metadata som 'makeRunId' i ditt svar. Fokusera enbart på att leverera resultatet av arbetsordern.

OBLIGATORISKT FORMAT - Du MÅSTE returnera kod i exakt detta format:

\`\`\`file:src/components/Example.tsx
// Fullständig fil-innehåll
import React from 'react';
export const Example = () => <div>Hello</div>;
\`\`\`

REGLER:
- Max 20 filer per svar
- Max 500 rader totalt
- Endast src/components/* och src/lib/*
- INGEN förklarande text utanför kod-block
- ALLTID fullständig fil-innehåll, aldrig "..." eller kommentarer om vad som ska läggas till

EXEMPEL PÅ KORREKT OUTPUT:
User: "Skapa en Button komponent"

\`\`\`file:src/components/Button.tsx
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {label}
    </button>
  );
};
\`\`\``;

  const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      conversationId: conversationId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: instruction },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Abacus API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0]?.message?.content || "";
  
  // Debug logging
  console.log("AI Response preview (first 500 chars):", aiResponse.substring(0, 500));
  console.log("AI Response length:", aiResponse.length);
  
  return aiResponse;
}

interface FileChange {
  path: string;
  content: string;
}

function parseCodeResponse(response: string): FileChange[] {
  const changes: FileChange[] = [];
  
  // Log raw response för debugging
  console.log("Parsing response, length:", response.length);
  console.log("Looking for pattern: ```file:path");
  
  // More lenient regex that handles missing closing backticks
  const fileRegex = /```file:([^\n]+)\n([\s\S]*?)(?:```|$)/g;
  
  let match;
  let fileCount = 0;
  let totalLines = 0;
  let matchesFound = 0;

  while ((match = fileRegex.exec(response)) !== null && fileCount < 20) {
    matchesFound++;
    const path = match[1].trim();
    const content = match[2].trim();
    
    console.log(`Match ${matchesFound}: path="${path}", content length=${content.length}`);
    
    // Validate path (only allow src/components/* and src/lib/*)
    if (!path.startsWith("src/components/") && !path.startsWith("src/lib/")) {
      console.log(`Skipping file outside allowed paths: ${path}`);
      continue;
    }

    const lines = content.split("\n").length;
    if (totalLines + lines > 500) {
      console.log(`Reached 500 line limit, stopping at ${fileCount} files`);
      break;
    }

    changes.push({ path, content });
    fileCount++;
    totalLines += lines;
  }
  
  console.log(`Total matches found: ${matchesFound}, valid files: ${fileCount}`);

  return changes;
}

async function commitToGitHub(params: {
  owner: string;
  repo: string;
  branch: string;
  changes: FileChange[];
  message: string;
}): Promise<{ sha: string }> {
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  if (!githubToken) throw new Error("GITHUB_TOKEN not configured");

  const { owner, repo, branch, changes, message } = params;
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

  // 1. Get current branch reference
  const refResponse = await fetch(`${baseUrl}/git/ref/heads/${branch}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!refResponse.ok) {
    throw new Error(`Failed to get branch ref: ${await refResponse.text()}`);
  }

  const refData = await refResponse.json();
  const currentCommitSha = refData.object.sha;

  // 2. Get current commit to get tree SHA
  const commitResponse = await fetch(`${baseUrl}/git/commits/${currentCommitSha}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!commitResponse.ok) {
    throw new Error(`Failed to get commit: ${await commitResponse.text()}`);
  }

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blobs for each file
  const tree = [];
  for (const change of changes) {
    const blobResponse = await fetch(`${baseUrl}/git/blobs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: change.content,
        encoding: "utf-8",
      }),
    });

    if (!blobResponse.ok) {
      throw new Error(`Failed to create blob for ${change.path}: ${await blobResponse.text()}`);
    }

    const blobData = await blobResponse.json();
    tree.push({
      path: change.path,
      mode: "100644",
      type: "blob",
      sha: blobData.sha,
    });
  }

  // 4. Create new tree
  const treeResponse = await fetch(`${baseUrl}/git/trees`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: tree,
    }),
  });

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${await treeResponse.text()}`);
  }

  const treeData = await treeResponse.json();

  // 5. Create new commit
  const newCommitResponse = await fetch(`${baseUrl}/git/commits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message,
      tree: treeData.sha,
      parents: [currentCommitSha],
    }),
  });

  if (!newCommitResponse.ok) {
    throw new Error(`Failed to create commit: ${await newCommitResponse.text()}`);
  }

  const newCommitData = await newCommitResponse.json();

  // 6. Update branch reference
  const updateRefResponse = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sha: newCommitData.sha,
      force: false,
    }),
  });

  if (!updateRefResponse.ok) {
    throw new Error(`Failed to update ref: ${await updateRefResponse.text()}`);
  }

  return { sha: newCommitData.sha };
}
