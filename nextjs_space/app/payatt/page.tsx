
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Users, MessageSquare, TrendingUp, Target, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PayAttPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    recentImports: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/payatt/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (fileType: 'customers' | 'statuses' | 'categories', file: File) => {
    setUploadProgress(`Laddar upp ${file.name}...`);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);

    try {
      const res = await fetch('/api/payatt/import', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setUploadProgress(`✓ Importerade ${result.count} ${fileType === 'customers' ? 'kunder' : 'poster'}`);
        setTimeout(() => {
          setUploadProgress(null);
          fetchStats();
        }, 3000);
      } else {
        const error = await res.json();
        setUploadProgress(`✗ Fel: ${error.error}`);
      }
    } catch (error) {
      setUploadProgress(`✗ Fel vid uppladdning`);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PayAtt - Lojalitetsprogram</h1>
          <p className="text-muted-foreground">Återvinn inaktiva kunder med AI-driven SMS-marknadsföring</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt kunder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <Users className="h-4 w-4 text-muted-foreground mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktiva kunder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCustomers}</div>
            <TrendingUp className="h-4 w-4 text-green-600 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inaktiva kunder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inactiveCustomers}</div>
            <Target className="h-4 w-4 text-orange-600 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Senaste import</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentImports}</div>
            <Upload className="h-4 w-4 text-muted-foreground mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import">📁 Import Data</TabsTrigger>
          <TabsTrigger value="campaigns">💬 SMS Kampanjer</TabsTrigger>
          <TabsTrigger value="loyalty">🎁 Stämpelkort</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Zoezi Data</CardTitle>
              <CardDescription>
                Ladda upp dina Excel-filer från Zoezi för att synka kunddata till Flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadProgress && (
                <Alert>
                  <AlertDescription>{uploadProgress}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customers Upload */}
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Kunder.xlsx</CardTitle>
                    <CardDescription>Huvudkundlista från Zoezi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <label htmlFor="customers-file" className="cursor-pointer">
                      <Button asChild variant="outline" className="w-full">
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Välj fil
                        </span>
                      </Button>
                    </label>
                    <input
                      id="customers-file"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('customers', file);
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Statuses Upload */}
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Kundstatus.xlsx</CardTitle>
                    <CardDescription>Statusar (Stammis, Terminare, etc.)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <label htmlFor="statuses-file" className="cursor-pointer">
                      <Button asChild variant="outline" className="w-full">
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Välj fil
                        </span>
                      </Button>
                    </label>
                    <input
                      id="statuses-file"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('statuses', file);
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Categories Upload */}
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Kurskategorier.xlsx</CardTitle>
                    <CardDescription>Kategoriinformation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <label htmlFor="categories-file" className="cursor-pointer">
                      <Button asChild variant="outline" className="w-full">
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Välj fil
                        </span>
                      </Button>
                    </label>
                    <input
                      id="categories-file"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('categories', file);
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>SMS Kampanjer med AI</CardTitle>
              <CardDescription>
                Använd AI för att generera personliga SMS-kampanjer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/payatt/campaigns')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Skapa kampanj med AI
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty">
          <Card>
            <CardHeader>
              <CardTitle>Stämpelkort & Belöningar</CardTitle>
              <CardDescription>
                Hantera lojalitetsprogram och stämpelkort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Kommer snart...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
