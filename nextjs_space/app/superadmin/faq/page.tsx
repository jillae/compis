
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  keywords: string[];
  isActive: boolean;
  priority: number;
  timesUsed: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const FAQ_CATEGORIES = [
  'Priser',
  'Bokningar',
  'Behandlingar',
  'Öppettider',
  'Policies',
  'Produkter',
  'Annat',
];

export default function FAQManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    keywords: '',
    priority: 0,
    isActive: true,
  });

  // Auth check
  useEffect(() => {
    if (status === 'loading') return;

    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!session || !allowedRoles.includes(session.user.role as UserRole)) {
      router.replace('/dashboard');
      return;
    }

    fetchFAQs();
  }, [session, status, selectedCategory, searchQuery]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const clinicId = session?.user?.clinicId;

      if (!clinicId) {
        toast.error('No clinic associated with your account');
        return;
      }

      const params = new URLSearchParams({
        clinicId,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/superadmin/faq?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }

      const data = await response.json();
      setFaqs(data.faqs);
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      toast.error('Kunde inte hämta FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const clinicId = session?.user?.clinicId;

      if (!clinicId) {
        toast.error('No clinic ID');
        return;
      }

      const method = editingFAQ ? 'PUT' : 'POST';
      const url = '/api/superadmin/faq';

      const payload = {
        ...(editingFAQ && { id: editingFAQ.id }),
        clinicId,
        question: formData.question,
        answer: formData.answer,
        category: formData.category || null,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        priority: formData.priority,
        isActive: formData.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save FAQ');
      }

      toast.success(editingFAQ ? 'FAQ uppdaterad!' : 'FAQ skapad!');
      setIsDialogOpen(false);
      resetForm();
      fetchFAQs();
    } catch (error) {
      console.error('Save FAQ error:', error);
      toast.error('Kunde inte spara FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill radera denna FAQ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/faq?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete FAQ');
      }

      toast.success('FAQ raderad');
      fetchFAQs();
    } catch (error) {
      console.error('Delete FAQ error:', error);
      toast.error('Kunde inte radera FAQ');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      keywords: faq.keywords.join(', '),
      priority: faq.priority,
      isActive: faq.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingFAQ(null);
    setFormData({
      question: '',
      answer: '',
      category: '',
      keywords: '',
      priority: 0,
      isActive: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            FAQ Management
          </h1>
          <p className="text-muted-foreground">Hantera vanliga frågor för Voice AI och kundsupport</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Lägg till FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFAQ ? 'Redigera FAQ' : 'Skapa ny FAQ'}</DialogTitle>
              <DialogDescription>
                Lägg till vanliga frågor och svar för att förbättra Voice AI
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Fråga *</Label>
                <Input
                  id="question"
                  placeholder="T.ex. Vad kostar en laserbehandling?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="answer">Svar *</Label>
                <Textarea
                  id="answer"
                  placeholder="Skriv ett tydligt och hjälpsamt svar..."
                  rows={4}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioritet</Label>
                  <Input
                    id="priority"
                    type="number"
                    placeholder="0"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Högre nummer = visas först</p>
                </div>
              </div>

              <div>
                <Label htmlFor="keywords">Nyckelord (kommaseparerade)</Label>
                <Input
                  id="keywords"
                  placeholder="pris, laser, behandling"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Hjälper AI att matcha rätt FAQ</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Aktiv (visas för Voice AI)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}>
                Avbryt
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.question || !formData.answer}>
                {editingFAQ ? 'Uppdatera' : 'Skapa'} FAQ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök i frågor och svar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Alla kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kategorier</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQs List */}
      <div className="space-y-4">
        {faqs.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Inga FAQs hittades. Lägg till din första FAQ för att komma igång!
              </p>
            </CardContent>
          </Card>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {faq.category && (
                        <Badge variant="secondary">{faq.category}</Badge>
                      )}
                      {!faq.isActive && (
                        <Badge variant="outline">Inaktiv</Badge>
                      )}
                      {faq.priority > 0 && (
                        <Badge variant="outline">Prioritet: {faq.priority}</Badge>
                      )}
                      {faq.timesUsed > 0 && (
                        <Badge variant="outline">Använd {faq.timesUsed}x</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(faq)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                {faq.keywords.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">Nyckelord:</span>
                    {faq.keywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
