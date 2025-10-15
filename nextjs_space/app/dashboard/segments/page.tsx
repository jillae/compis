
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Edit, Trash2, Download } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  tags: Tag[];
  _count: {
    customers: number;
  };
  createdAt: string;
}

export default function SegmentsPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSegments();
      fetchTags();
    }
  }, [status]);

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments');
      if (response.ok) {
        const data = await response.json();
        setSegments(data);
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta segment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreateSegment = async () => {
    if (selectedTags.length === 0) {
      toast({
        title: 'Välj taggar',
        description: 'Du måste välja minst en tagg för segmentet',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tagIds: selectedTags,
        }),
      });

      if (response.ok) {
        const newSegment = await response.json();
        setSegments([...segments, newSegment]);
        setIsCreateOpen(false);
        resetForm();
        toast({
          title: 'Segment skapat',
          description: `Segmentet "${formData.name}" har skapats`,
        });
      } else {
        throw new Error('Failed to create segment');
      }
    } catch (error) {
      console.error('Error creating segment:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte skapa segment',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSegment = async () => {
    if (!editingSegment) return;

    try {
      const response = await fetch(`/api/segments/${editingSegment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tagIds: selectedTags,
        }),
      });

      if (response.ok) {
        const updatedSegment = await response.json();
        setSegments(segments.map(s => s.id === editingSegment.id ? updatedSegment : s));
        setEditingSegment(null);
        resetForm();
        toast({
          title: 'Segment uppdaterat',
          description: `Segmentet "${formData.name}" har uppdaterats`,
        });
      } else {
        throw new Error('Failed to update segment');
      }
    } catch (error) {
      console.error('Error updating segment:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte uppdatera segment',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta segment?')) return;

    try {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSegments(segments.filter(s => s.id !== segmentId));
        toast({
          title: 'Segment borttaget',
          description: 'Segmentet har tagits bort',
        });
      } else {
        throw new Error('Failed to delete segment');
      }
    } catch (error) {
      console.error('Error deleting segment:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort segment',
        variant: 'destructive',
      });
    }
  };

  const handleExportSegment = async (segmentId: string, segmentName: string) => {
    try {
      const response = await fetch(`/api/segments/${segmentId}/customers`);
      if (response.ok) {
        const customers = await response.json();
        
        // Create CSV
        const headers = ['Namn', 'Email', 'Telefon', 'Taggar'];
        const rows = customers.map((c: any) => {
          const tagNames = Array.isArray(c.tags) 
            ? c.tags.map((t: any) => typeof t === 'string' ? t : t.tag?.name || t.name).join(', ')
            : '';
          return [
            c.name,
            c.email || '',
            c.phone || '',
            tagNames,
          ];
        });
        
        const csvContent = [
          headers.join(','),
          ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')),
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `segment-${segmentName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast({
          title: 'Export slutförd',
          description: `${customers.length} kunder exporterade`,
        });
      }
    } catch (error) {
      console.error('Error exporting segment:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte exportera segment',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setSelectedTags([]);
  };

  const openEditDialog = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
    });
    setSelectedTags(segment.tags.map(t => t.id));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colorMap[color] || colorMap.blue;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laddar segment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kundsegment</h1>
          <p className="text-muted-foreground mt-1">
            Skapa dynamiska segment baserat på taggar för riktad kommunikation
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Skapa nytt segment</DialogTitle>
              <DialogDescription>
                Välj taggar för att definiera ditt kundsegment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="T.ex. VIP Kunder"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beskriv detta segment..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Välj taggar*</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent ${
                        selectedTags.includes(tag.id) ? 'bg-accent' : ''
                      }`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                        className="rounded"
                      />
                      <Badge className={getColorClass(tag.color)}>
                        {tag.name}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Kunder som har minst en av dessa taggar kommer att inkluderas
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreateSegment} disabled={!formData.name || selectedTags.length === 0}>
                Skapa Segment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totalt Segment</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{segments.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {segments.reduce((sum, s) => sum + (s._count?.customers || 0), 0)} totala kunder
          </p>
        </CardContent>
      </Card>

      {/* Segments List */}
      <div className="space-y-4">
        {segments.map((segment) => (
          <Card key={segment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{segment.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {segment.description || 'Inget beskrivning'}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExportSegment(segment.id, segment.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(segment)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteSegment(segment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {segment._count?.customers || 0} kunder
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {segment.tags.map((tag) => (
                    <Badge key={tag.id} className={getColorClass(tag.color)}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Skapad {new Date(segment.createdAt).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSegment} onOpenChange={(open) => !open && setEditingSegment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redigera segment</DialogTitle>
            <DialogDescription>
              Uppdatera segmentets information och taggar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Namn*</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivning</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Välj taggar*</Label>
              <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent ${
                      selectedTags.includes(tag.id) ? 'bg-accent' : ''
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded"
                    />
                    <Badge className={getColorClass(tag.color)}>
                      {tag.name}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSegment(null)}>
              Avbryt
            </Button>
            <Button onClick={handleUpdateSegment} disabled={!formData.name || selectedTags.length === 0}>
              Uppdatera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
