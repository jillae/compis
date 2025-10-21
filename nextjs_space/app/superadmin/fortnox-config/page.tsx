
/**
 * Fortnox Configuration Page (SuperAdmin)
 * Configure Fortnox OAuth credentials and test connection
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw } from "lucide-react";

interface FortnoxConfig {
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  tokenExpiry: string | null;
}

export default function FortnoxConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [config, setConfig] = useState<FortnoxConfig>({
    clientId: "",
    clientSecret: "",
    enabled: false,
    tokenExpiry: null,
  });
  const [testResult, setTestResult] = useState<boolean | null>(null);

  // Check for OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success === "true") {
      toast({
        title: "✅ Fortnox Connected",
        description: "OAuth authentication successful!",
      });
      // Clear URL params
      window.history.replaceState({}, "", "/superadmin/fortnox-config");
      loadConfig();
    } else if (error) {
      toast({
        title: "❌ OAuth Error",
        description: `Failed to connect: ${error}`,
        variant: "destructive",
      });
      // Clear URL params
      window.history.replaceState({}, "", "/superadmin/fortnox-config");
    }
  }, [toast]);

  // Load current configuration
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/superadmin/fortnox-config");
      if (!response.ok) throw new Error("Failed to load configuration");
      
      const data = await response.json();
      setConfig({
        clientId: data.clientId || "",
        clientSecret: data.clientSecret || "",
        enabled: data.enabled || false,
        tokenExpiry: data.tokenExpiry || null,
      });
    } catch (error) {
      console.error("Failed to load Fortnox config:", error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/superadmin/fortnox-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        }),
      });

      if (!response.ok) throw new Error("Failed to save configuration");

      toast({
        title: "✅ Configuration Saved",
        description: "Fortnox credentials saved successfully",
      });

      loadConfig();
    } catch (error) {
      console.error("Failed to save Fortnox config:", error);
      toast({
        title: "❌ Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const initiateOAuth = () => {
    window.location.href = "/api/fortnox/auth";
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/fortnox/test-connection");
      const data = await response.json();
      setTestResult(data.success);

      if (data.success) {
        toast({
          title: "✅ Connection Successful",
          description: "Fortnox API is working correctly",
        });
      } else {
        toast({
          title: "❌ Connection Failed",
          description: data.message || "Failed to connect to Fortnox",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setTestResult(false);
      toast({
        title: "❌ Test Failed",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const refreshToken = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/fortnox/refresh-token", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to refresh token");

      const data = await response.json();
      toast({
        title: "✅ Token Refreshed",
        description: `New token expires: ${new Date(data.expiresAt).toLocaleString("sv-SE")}`,
      });

      loadConfig();
    } catch (error) {
      console.error("Failed to refresh token:", error);
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh access token",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const isTokenExpired = () => {
    if (!config.tokenExpiry) return false;
    return new Date(config.tokenExpiry) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Fortnox Integration</h1>
        <p className="text-muted-foreground mt-2">
          Configure Fortnox API credentials for bank transaction sync
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Connection Status
            {config.enabled ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.enabled && config.tokenExpiry && (
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Token Expires:</strong>{" "}
                {new Date(config.tokenExpiry).toLocaleString("sv-SE")}
              </p>
              {isTokenExpired() && (
                <Alert variant="destructive">
                  <AlertDescription>
                    ⚠️ Access token has expired. Please refresh or re-authenticate.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>OAuth2 Credentials</CardTitle>
          <CardDescription>
            Get your credentials from{" "}
            <a
              href="https://developer.fortnox.se"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Fortnox Developer Portal
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              placeholder="3DCiYeshpNAi"
            />
          </div>

          <div>
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              value={config.clientSecret}
              onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              placeholder="3m8Mg7R98A"
            />
          </div>

          <Alert>
            <AlertDescription>
              <strong>Redirect URI:</strong>{" "}
              {typeof window !== "undefined" && `${window.location.origin}/api/fortnox/callback`}
              <br />
              Make sure this is configured in your Fortnox app settings.
            </AlertDescription>
          </Alert>

          <Button onClick={saveConfig} disabled={saving || !config.clientId || !config.clientSecret}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* OAuth Connection Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authorize Access</CardTitle>
          <CardDescription>
            Connect Flow to your Fortnox account to enable bank transaction sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={initiateOAuth}
            disabled={!config.clientId || !config.clientSecret}
            size="lg"
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect to Fortnox
          </Button>

          {!config.clientId || !config.clientSecret ? (
            <Alert>
              <AlertDescription>
                Please save your Client ID and Client Secret before connecting
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {/* Testing & Management Card */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={testing} variant="outline">
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>

              <Button onClick={refreshToken} disabled={refreshing} variant="outline">
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Token
              </Button>
            </div>

            {testResult !== null && (
              <Alert variant={testResult ? "default" : "destructive"}>
                <AlertDescription>
                  {testResult ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Connection successful! Fortnox API is working.
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Connection failed. Please check your credentials and try again.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
