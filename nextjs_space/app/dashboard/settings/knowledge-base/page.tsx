
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, FileText, Phone, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  message?: string;
  progress?: number;
}

export default function KnowledgeBasePage() {
  const { data: session } = useSession();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [urlDescription, setUrlDescription] = useState("");
  const [audioStatus, setAudioStatus] = useState<UploadStatus>({ status: 'idle' });
  const [documentStatus, setDocumentStatus] = useState<UploadStatus>({ status: 'idle' });
  const [urlStatus, setUrlStatus] = useState<UploadStatus>({ status: 'idle' });

  const handleAudioUpload = async () => {
    if (!audioFile) return;

    setAudioStatus({ status: 'uploading', message: 'Laddar upp...' });

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('type', 'audio');

    try {
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      setAudioStatus({ status: 'processing', message: 'Transkriberar och analyserar...' });

      const result = await response.json();
      
      setAudioStatus({ 
        status: 'success', 
        message: `Bearbetat! ${result.chunksCreated} kunskapsbitar tillagda.` 
      });
      
      toast.success('Telefonsamtal tillagt i kunskapsbasen');
      setAudioFile(null);

      // Reset after 3 seconds
      setTimeout(() => setAudioStatus({ status: 'idle' }), 3000);
    } catch (error) {
      console.error('Audio upload error:', error);
      setAudioStatus({ status: 'error', message: 'Fel vid uppladdning' });
      toast.error('Kunde inte bearbeta ljudfilen');
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile) return;

    setDocumentStatus({ status: 'uploading', message: 'Laddar upp...' });

    const formData = new FormData();
    formData.append('file', documentFile);
    formData.append('type', 'document');

    try {
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      setDocumentStatus({ status: 'processing', message: 'Extraherar text och analyserar...' });

      const result = await response.json();
      
      setDocumentStatus({ 
        status: 'success', 
        message: `Bearbetat! ${result.chunksCreated} kunskapsbitar tillagda.` 
      });
      
      toast.success('Dokument tillagt i kunskapsbasen');
      setDocumentFile(null);

      setTimeout(() => setDocumentStatus({ status: 'idle' }), 3000);
    } catch (error) {
      console.error('Document upload error:', error);
      setDocumentStatus({ status: 'error', message: 'Fel vid uppladdning' });
      toast.error('Kunde inte bearbeta dokumentet');
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) return;

    setUrlStatus({ status: 'uploading', message: 'Hämtar innehåll...' });

    try {
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'url', 
          url,
          description: urlDescription 
        }),
      });

      if (!response.ok) throw new Error('URL processing failed');

      setUrlStatus({ status: 'processing', message: 'Analyserar innehåll...' });

      const result = await response.json();
      
      setUrlStatus({ 
        status: 'success', 
        message: `Bearbetat! ${result.chunksCreated} kunskapsbitar tillagda.` 
      });
      
      toast.success('Länk tillagd i kunskapsbasen');
      setUrl("");
      setUrlDescription("");

      setTimeout(() => setUrlStatus({ status: 'idle' }), 3000);
    } catch (error) {
      console.error('URL processing error:', error);
      setUrlStatus({ status: 'error', message: 'Fel vid bearbetning' });
      toast.error('Kunde inte bearbeta länken');
    }
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Kunskapsbas</h1>
        <p className="text-muted-foreground">
          Träna Flow AI med dina egna samtal, dokument och länkar för mer personliga och korrekta svar
        </p>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          <strong>Levande intelligens:</strong> Ju mer innehåll du laddar upp, desto bättre blir Flow på att 
          förstå din verksamhet, terminologi och vanliga kundfrågor. Allt innehåll processas automatiskt 
          och blir omedelbart tillgängligt för AI-assistenten.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="audio" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audio">
            <Phone className="h-4 w-4 mr-2" />
            Telefonsamtal
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Dokument
          </TabsTrigger>
          <TabsTrigger value="links">
            <Link className="h-4 w-4 mr-2" />
            Länkar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle>Ladda upp telefonsamtal</CardTitle>
              <CardDescription>
                Inspelningar av samtal med leads och kunder hjälper Flow att lära sig er terminologi 
                och vanliga frågor. Stödda format: MP3, WAV, M4A, FLAC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audio-file">Ljudfil</Label>
                <div className="flex gap-2">
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    disabled={audioStatus.status !== 'idle'}
                  />
                  <Button
                    onClick={handleAudioUpload}
                    disabled={!audioFile || audioStatus.status !== 'idle'}
                  >
                    {audioStatus.status !== 'idle' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Bearbetar
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Ladda upp
                      </>
                    )}
                  </Button>
                </div>
                {audioFile && (
                  <p className="text-sm text-muted-foreground">
                    Vald fil: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {audioStatus.status !== 'idle' && (
                <Alert>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(audioStatus)}
                    <AlertDescription>{audioStatus.message}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Tips för bästa resultat:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Använd inspelningar med tydligt ljud och minimal bakgrundsljud</li>
                  <li>Längre samtal (5-30 min) ger mer omfattande träning</li>
                  <li>Ladda upp varierade samtal för att täcka olika ämnen och situationer</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Ladda upp dokument</CardTitle>
              <CardDescription>
                Behandlingsprotokoll, produktinformation, prislista eller annat material. 
                Stödda format: PDF, DOCX, TXT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-file">Dokument</Label>
                <div className="flex gap-2">
                  <Input
                    id="document-file"
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    disabled={documentStatus.status !== 'idle'}
                  />
                  <Button
                    onClick={handleDocumentUpload}
                    disabled={!documentFile || documentStatus.status !== 'idle'}
                  >
                    {documentStatus.status !== 'idle' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Bearbetar
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Ladda upp
                      </>
                    )}
                  </Button>
                </div>
                {documentFile && (
                  <p className="text-sm text-muted-foreground">
                    Vald fil: {documentFile.name} ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {documentStatus.status !== 'idle' && (
                <Alert>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(documentStatus)}
                    <AlertDescription>{documentStatus.message}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Exempel på användbara dokument:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Behandlingsprotokoll och eftervårdsinstruktioner</li>
                  <li>Produktinformation och ingredienslistor</li>
                  <li>Prislista och paketbeskrivningar</li>
                  <li>FAQ och policydokument</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Indexera webbsidor</CardTitle>
              <CardDescription>
                Lägg till länkar till er webbplats, blogg eller andra relevanta sidor som Flow ska kunna hänvisa till
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://exempel.se/behandlingar"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={urlStatus.status !== 'idle'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url-description">Beskrivning (valfritt)</Label>
                <Textarea
                  id="url-description"
                  placeholder="T.ex. 'Översikt av alla våra behandlingar'"
                  value={urlDescription}
                  onChange={(e) => setUrlDescription(e.target.value)}
                  disabled={urlStatus.status !== 'idle'}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleUrlSubmit}
                disabled={!url || urlStatus.status !== 'idle'}
                className="w-full"
              >
                {urlStatus.status !== 'idle' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Bearbetar
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Indexera sida
                  </>
                )}
              </Button>

              {urlStatus.status !== 'idle' && (
                <Alert>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(urlStatus)}
                    <AlertDescription>{urlStatus.message}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Lägg till alla sidor med behandlingsinformation</li>
                  <li>Inkludera bokningsinstruktioner och öppettider</li>
                  <li>Bloggartiklar och nyheter ger Flow mer kontext</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Så här används kunskapsbasen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Allt innehåll du laddar upp processas automatiskt:
          </p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li><strong>Transkribering & Extraktion:</strong> Ljud transkriberas, dokument parsas, webbsidor scrapas</li>
            <li><strong>Intelligent chunking:</strong> Texten delas upp i meningsfulla kunskapsbitar</li>
            <li><strong>AI-embeddings:</strong> Varje bit indexeras för semantisk sökning</li>
            <li><strong>Omedelbar aktivering:</strong> Flow kan nu använda informationen i alla konversationer</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-3">
            Resultatet? En AI-assistent som pratar som <em>dig</em>, svarar som <em>du</em> skulle svara, 
            och känner till <em>din</em> verksamhet in i minsta detalj.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
