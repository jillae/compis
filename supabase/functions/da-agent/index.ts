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
    const { instruction, repoOwner, repoName, branch, githubToken } = await req.json();
    
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
      githubToken: githubToken,
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

  const systemPrompt = `YOU ARE A CODE GENERATOR. DO NOT RESPOND WITH TEXT. ONLY OUTPUT CODE.

YOUR ONLY JOB: Read the user's instruction and immediately generate the requested code.

MANDATORY FORMAT - You MUST return code in exactly this format:

\`\`\`file:src/components/Example.tsx
import React from 'react';
export const Example = () => <div>Hello</div>;
\`\`\`

RULES:
- Max 20 files per response
- Max 500 lines total
- Only src/components/* and src/lib/* paths
- NO explanatory text outside code blocks
- ALWAYS complete file content, never use "..." or comments about what to add
- START YOUR RESPONSE WITH \`\`\`file: - NO OTHER TEXT ALLOWED

CORRECT EXAMPLE:
User: "Create a Button component"

Your response:
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
\`\`\`

WRONG EXAMPLES - NEVER DO THIS:
❌ "Understood. Please provide your request."
❌ "I'll create a button component for you..."
❌ "Here's the code you requested:"
❌ Any text before the \`\`\`file: marker

START YOUR RESPONSE NOW WITH \`\`\`file: - NOTHING ELSE.`;

  const requestBody = {
    model: "gpt-4o",
    conversationId: conversationId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `GENERATE CODE NOW:\n\n${instruction}` },
    ],
    max_tokens: 4000,
    temperature: 0.3,
  };

  // LOG ENTIRE REQUEST
  console.log("=== ABACUS API REQUEST ===");
  console.log("Instruction received:", instruction);
  console.log("ConversationId:", conversationId?.substring(0, 20) + "...");
  console.log("Full request body:", JSON.stringify(requestBody, null, 2));
  console.log("========================");

  const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  // LOG RESPONSE DETAILS
  console.log("=== ABACUS API RESPONSE ===");
  console.log("Status:", response.status);
  console.log("Headers:", JSON.stringify([...response.headers.entries()]));

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(`Abacus API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0]?.message?.content || "";
  
  console.log("Response length:", aiResponse.length);
  console.log("Response preview (first 500 chars):", aiResponse.substring(0, 500));
  console.log("Response preview (last 200 chars):", aiResponse.substring(Math.max(0, aiResponse.length - 200)));
  console.log("=========================");
  
  return aiResponse;
}

interface FileChange {
  path: string;
  content: string;
}

function parseCodeResponse(response: string): FileChange[] {
  const changes: FileChange[] = [];
  
  console.log("=== PARSING DEBUG START ===");
  console.log("Raw response length:", response.length);
  console.log("First 300 chars:", response.substring(0, 300));
  console.log("Last 300 chars:", response.substring(Math.max(0, response.length - 300)));
  
  // Try multiple regex patterns
  const patterns = [
    { name: "Standard", regex: /```file:([^\n]+)\n([\s\S]*?)```/g },
    { name: "Lenient (no closing)", regex: /```file:([^\n]+)\n([\s\S]*?)(?:```|$)/g },
    { name: "Whitespace tolerant", regex: /```file:\s*([^\n]+)\s*\n([\s\S]*?)(?:```|$)/g },
    { name: "Very lenient", regex: /```\s*file:\s*([^\n]+)\s*\n([\s\S]*?)(?:```|$)/g },
  ];
  
  for (const pattern of patterns) {
    console.log(`\n--- Trying pattern: ${pattern.name} ---`);
    pattern.regex.lastIndex = 0; // Reset regex
    
    let match;
    let matchCount = 0;
    const tempChanges: FileChange[] = [];
    let totalLines = 0;
    
    while ((match = pattern.regex.exec(response)) !== null && tempChanges.length < 20) {
      matchCount++;
      const path = match[1].trim();
      const content = match[2].trim();
      
      console.log(`  Match ${matchCount}:`);
      console.log(`    Path: "${path}"`);
      console.log(`    Content length: ${content.length}`);
      console.log(`    Content preview: ${content.substring(0, 80)}...`);
      
      // Validate path - expanded to include nextjs_space
      const isValidPath = path.startsWith("src/components/") || 
                          path.startsWith("src/lib/") ||
                          path.startsWith("nextjs_space/");
      
      if (!isValidPath) {
        console.log(`    ❌ Skipping: Invalid path (must be src/components/, src/lib/, or nextjs_space/)`);
        continue;
      }
      
      // Check line limit
      const lines = content.split("\n").length;
      if (totalLines + lines > 500) {
        console.log(`    ❌ Stopping: Would exceed 500 line limit (current: ${totalLines}, would add: ${lines})`);
        break;
      }
      
      console.log(`    ✅ Valid file (${lines} lines)`);
      tempChanges.push({ path, content });
      totalLines += lines;
    }
    
    console.log(`  Pattern "${pattern.name}" result: ${tempChanges.length} files, ${matchCount} total matches`);
    
    if (tempChanges.length > 0) {
      console.log(`✅ SUCCESS: Pattern "${pattern.name}" found ${tempChanges.length} valid files`);
      changes.push(...tempChanges);
      break;
    }
  }
  
  console.log("\n=== PARSING DEBUG END ===");
  console.log(`Final result: ${changes.length} files to commit`);
  
  if (changes.length === 0) {
    console.error("⚠️ NO FILES PARSED - This will trigger an error response");
  }
  
  return changes;
}

async function commitToGitHub(params: {
  owner: string;
  repo: string;
  branch: string;
  changes: FileChange[];
  message: string;
  githubToken: string;
}): Promise<{ sha: string }> {
  if (!params.githubToken) throw new Error("GITHUB_TOKEN not provided");

  const { owner, repo, branch, changes, message, githubToken } = params;
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
