
/**
 * 46elks Subaccounts Management (SuperAdmin)
 * 
 * List all clinics and their subaccounts
 * Create subaccounts for clinics
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, XCircle, Plus, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Subaccount {
  clinicId: string;
  clinicName: string;
  subaccountId: string | null;
  createdAt: Date | null;
}

interface SubaccountDetails {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
}

export default function ElksSubaccountsPage() {
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [viewingCredentials, setViewingCredentials] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<SubaccountDetails | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSubaccounts();
  }, []);

  const fetchSubaccounts = async () => {
    try {
      const res = await fetch('/api/46elks/subaccounts');
      const data = await res.json();

      if (data.success) {
        setSubaccounts(data.subaccounts);
      } else {
        toast.error(data.error || 'Failed to load subaccounts');
      }
    } catch (error) {
      console.error('Failed to fetch subaccounts:', error);
      toast.error('Failed to load subaccounts');
    } finally {
      setLoading(false);
    }
  };

  const createSubaccount = async (clinicId: string, clinicName: string) => {
    setCreating(clinicId);
    try {
      const res = await fetch('/api/46elks/subaccounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, clinicName }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Subaccount created for ${clinicName}`);
        await fetchSubaccounts();
      } else {
        toast.error(data.error || 'Failed to create subaccount');
      }
    } catch (error) {
      console.error('Failed to create subaccount:', error);
      toast.error('Failed to create subaccount');
    } finally {
      setCreating(null);
    }
  };

  const viewCredentials = async (clinicId: string) => {
    setViewingCredentials(clinicId);
    setShowPassword(false);
    try {
      const res = await fetch(`/api/46elks/subaccounts/${clinicId}`);
      const data = await res.json();

      if (data.success) {
        setCredentials(data.subaccount);
      } else {
        toast.error(data.error || 'Failed to load credentials');
        setViewingCredentials(null);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      toast.error('Failed to load credentials');
      setViewingCredentials(null);
    }
  };

  const closeCredentialsDialog = () => {
    setViewingCredentials(null);
    setCredentials(null);
    setShowPassword(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            46elks Subaccounts Management
          </CardTitle>
          <CardDescription>
            Manage subaccounts for each clinic. Each subaccount provides isolated API credentials
            for tracking usage and billing per clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinic</TableHead>
                <TableHead>Subaccount ID</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subaccounts.map((sub) => (
                <TableRow key={sub.clinicId}>
                  <TableCell className="font-medium">{sub.clinicName}</TableCell>
                  <TableCell>
                    {sub.subaccountId ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {sub.subaccountId}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.createdAt ? (
                      new Date(sub.createdAt).toLocaleDateString('sv-SE')
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.subaccountId ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        No Subaccount
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {sub.subaccountId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewCredentials(sub.clinicId)}
                      >
                        View Credentials
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => createSubaccount(sub.clinicId, sub.clinicName)}
                        disabled={creating === sub.clinicId}
                      >
                        {creating === sub.clinicId ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Subaccount
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {subaccounts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No clinics found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials Dialog */}
      <Dialog open={!!viewingCredentials} onOpenChange={closeCredentialsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Subaccount Credentials</DialogTitle>
            <DialogDescription>
              API credentials for this clinic's subaccount. Keep these secure.
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-4">
              {/* Subaccount ID */}
              <div>
                <label className="text-sm font-medium">Subaccount ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded">
                    {credentials.id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.id, 'Subaccount ID')}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium">API Username</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded">
                    {credentials.username}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.username, 'Username')}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium">API Password</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono">
                    {showPassword ? credentials.password : '••••••••••••••••'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.password, 'Password')}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Created At */}
              <div>
                <label className="text-sm font-medium">Created At</label>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(credentials.createdAt).toLocaleString('sv-SE')}
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Usage in API calls:</p>
                <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`const auth = Buffer.from(
  \`\${username}:\${password}\`
).toString('base64');

fetch('https://api.46elks.com/a1/SMS', {
  headers: {
    'Authorization': \`Basic \${auth}\`
  }
});`}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeCredentialsDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
