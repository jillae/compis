
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Gift,
  Mail,
  Copy,
  Check,
  Send,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewardsEarned: number;
}

interface Referral {
  id: string;
  referredEmail: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  rewardClaimed: boolean;
  createdAt: string;
  referred?: {
    name: string;
    email: string;
  };
}

export default function ReferralsPage() {
  const { data: session } = useSession() || {};
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNotes, setInviteNotes] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch('/api/referrals/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      // Fetch referral code
      const codeRes = await fetch('/api/referrals/code');
      if (codeRes.ok) {
        const codeData = await codeRes.json();
        setReferralCode(codeData.referralCode);
      }
      
      // Fetch referrals
      const referralsRes = await fetch('/api/referrals');
      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        setReferrals(referralsData.referrals || []);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Kunde inte hämta referral-data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Länk kopierad!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail) {
      toast.error('E-postadress krävs');
      return;
    }
    
    setSendingInvite(true);
    
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referredEmail: inviteEmail,
          notes: inviteNotes
        })
      });
      
      if (res.ok) {
        toast.success('Inbjudan skickad!');
        setInviteEmail('');
        setInviteNotes('');
        fetchData(); // Refresh data
      } else {
        const data = await res.json();
        toast.error(data.error || 'Kunde inte skicka inbjudan');
      }
    } catch (error) {
      toast.error('Något gick fel');
    } finally {
      setSendingInvite(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Slutförd</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Väntande</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Utgången</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Avbruten</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hänvisa & Tjäna</h1>
          <p className="text-gray-500 mt-1">Bjud in kollegor och få 1 månad gratis</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const referralLink = referralCode ? `${window.location.origin}/auth/signup?ref=${referralCode}` : '';

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hänvisa & Tjäna</h1>
        <p className="text-gray-500 mt-1">Bjud in kollegor och få 1 månad gratis för varje referral</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Hänvisningar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Väntande</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slutförda</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gratis Månader</CardTitle>
            <Gift className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRewardsEarned || 0}</div>
            <p className="text-xs text-muted-foreground">månade tjänade</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle>Din Hänvisningslänk</CardTitle>
            <CardDescription>
              Dela denna länk med kollegor. Ni får båda 1 månad gratis när de skapar konto!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Erbjudande:</strong> För varje kollega som registrerar sig med din länk får ni båda 1 månad gratis!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Hänvisningskod</Label>
              <div className="flex gap-2">
                <Input 
                  value={referralCode} 
                  readOnly 
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    toast.success('Kod kopierad!');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hänvisningslänk</Label>
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="text-sm"
                />
                <Button
                  variant="default"
                  size="icon"
                  onClick={copyReferralLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Send Invite */}
        <Card>
          <CardHeader>
            <CardTitle>Skicka Inbjudan</CardTitle>
            <CardDescription>
              Bjud in kollegor direkt via e-post
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">E-postadress</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="kollega@exempel.se"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={sendingInvite}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteNotes">Meddelande (valfritt)</Label>
                <Textarea
                  id="inviteNotes"
                  placeholder="Hej! Jag använder Flow och tror det skulle passa dig också..."
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  disabled={sendingInvite}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={sendingInvite}
              >
                {sendingInvite ? (
                  <>Skickar...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Skicka Inbjudan
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Dina Hänvisningar</CardTitle>
          <CardDescription>
            Översikt över alla hänvisningar du har skickat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Inga hänvisningar än</h3>
              <p className="mt-1 text-sm text-gray-500">
                Börja bjuda in kollegor för att tjäna gratis månader!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {referral.referred?.name || referral.referredEmail}
                        </p>
                        <p className="text-sm text-gray-500">{referral.referredEmail}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusBadge(referral.status)}
                    <p className="text-sm text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
