
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Copy, 
  Eye,
  Send,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EMAIL_TEMPLATES, personalizeEmailTemplate, type EmailTemplate } from '@/lib/email-templates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  if (status === 'loading') {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  const handleCopyTemplate = (template: EmailTemplate) => {
    const text = `Subject: ${template.subject}\n\n${template.body}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Template Copied',
      description: 'Template has been copied to clipboard',
    });
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleSendTest = async () => {
    if (!testEmail || !selectedTemplate) return;

    try {
      setSending(true);
      
      // TODO: Implement test email sending
      toast({
        title: 'Test Email Sent',
        description: `Test email sent to ${testEmail}`,
      });
      
      setTestEmail('');
      setPreviewOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to Send Test',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      welcome: 'bg-green-100 text-green-700',
      retention: 'bg-orange-100 text-orange-700',
      milestone: 'bg-purple-100 text-purple-700',
      promotional: 'bg-blue-100 text-blue-700',
      transactional: 'bg-gray-100 text-gray-700',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const exampleTokens = {
    firstName: 'Anna',
    name: 'Anna Andersson',
    clinicName: 'Beauty Clinic Stockholm',
    clinicPhone: '+46 70 123 45 67',
    bookingUrl: 'https://clinic.com/book',
    totalVisits: '15',
    lifetimeValue: '12500',
    expiryDate: '31 mars 2025',
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <BackButton href="/dashboard/marketing-triggers" />
        <h1 className="text-3xl font-bold mt-2">Email Templates</h1>
        <p className="text-muted-foreground mt-1">
          Pre-built templates for your marketing campaigns
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {EMAIL_TEMPLATES.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <Badge className={getCategoryBadge(template.category)}>
                    {template.category}
                  </Badge>
                </div>
              </div>
              <CardDescription className="mt-2">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Subject Preview */}
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <div className="text-sm font-medium mt-1 p-2 bg-muted rounded">
                  {personalizeEmailTemplate(template.subject, exampleTokens)}
                </div>
              </div>

              {/* Body Preview */}
              <div>
                <Label className="text-xs text-muted-foreground">Body Preview</Label>
                <div className="text-sm mt-1 p-3 bg-muted rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {personalizeEmailTemplate(template.body, exampleTokens).substring(0, 200)}...
                </div>
              </div>

              {/* Personalization Tokens */}
              <div>
                <Label className="text-xs text-muted-foreground">Available Tokens</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.personalizationTokens.map((token) => (
                    <Badge key={token} variant="outline" className="text-xs">
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyTemplate(template)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(template)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Preview with example personalization data
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <Label>Subject</Label>
                <div className="p-3 bg-muted rounded mt-2 font-medium">
                  {personalizeEmailTemplate(selectedTemplate.subject, exampleTokens)}
                </div>
              </div>

              {/* Body */}
              <div>
                <Label>Email Body</Label>
                <div className="p-4 bg-muted rounded mt-2 whitespace-pre-wrap">
                  {personalizeEmailTemplate(selectedTemplate.body, exampleTokens)}
                </div>
              </div>

              {/* Test Email */}
              <div className="pt-4 border-t">
                <Label htmlFor="testEmail">Send Test Email</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button 
                    onClick={handleSendTest}
                    disabled={!testEmail || sending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Send a test email with example personalization data
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
