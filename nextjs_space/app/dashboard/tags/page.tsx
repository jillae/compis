
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Tag as TagIcon, Users, Edit, Trash2, RefreshCw } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  source: 'MANUAL' | 'AUTOMATED' | 'IMPORTED';
  _count: {
    customerTags: number;
  };
}

const TAG_COLORS = [
  { value: 'blue', label: 'Blå', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'green', label: 'Grön', class: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'red', label: 'Röd', class: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'yellow', label: 'Gul', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'purple', label: 'Lila', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'gray', label: 'Grå', class: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const TAG_ICONS = ['tag', 'star', 'heart', 'crown', 'zap', 'target', 'award', 'gift'];

export default function TagsPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    icon: 'tag',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTags();
    }
  }, [status]);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta taggar',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTags = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/integrations/sync-tags', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Synkronisering slutförd',
          description: `${data.tagsCreated} nya taggar skapade, ${data.customersTagged} kunder taggade`,
        });
        fetchTags();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing tags:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte synkronisera taggar',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTag = async () => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'MANUAL',
        }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags([...tags, newTag]);
        setIsCreateOpen(false);
        resetForm();
        toast({
          title: 'Tagg skapad',
          description: `Taggen "${formData.name}" har skapats`,
        });
      } else {
        throw new Error('Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte skapa tagg',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedTag = await response.json();
        setTags(tags.map(t => t.id === editingTag.id ? updatedTag : t));
        setEditingTag(null);
        resetForm();
        toast({
          title: 'Tagg uppdaterad',
          description: `Taggen "${formData.name}" har uppdaterats`,
        });
      } else {
        throw new Error('Failed to update tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte uppdatera tagg',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna tagg?')) return;

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTags(tags.filter(t => t.id !== tagId));
        toast({
          title: 'Tagg borttagen',
          description: 'Taggen har tagits bort',
        });
      } else {
        throw new Error('Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort tagg',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      icon: 'tag',
    });
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
      icon: tag.icon || 'tag',
    });
  };

  const getColorClass = (color: string) => {
    return TAG_COLORS.find(c => c.value === color)?.class || TAG_COLORS[0].class;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laddar taggar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tag Manager</h1>
          <p className="text-muted-foreground mt-1">
            Organisera och segmentera dina kunder med taggar
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncTags}
            disabled={syncing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Synka från Bokadirekt
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa Tagg
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Skapa ny tagg</DialogTitle>
                <DialogDescription>
                  Skapa en tagg för att kategorisera dina kunder
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Namn*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="T.ex. VIP Kund"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivning</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beskriv vad denna tagg betyder..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Färg</Label>
                    <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAG_COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.class}`}></div>
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Ikon</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAG_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="pt-2">
                  <Label className="text-sm text-muted-foreground">Förhandsvisning:</Label>
                  <div className="mt-2">
                    <Badge className={getColorClass(formData.color)}>
                      {formData.name || 'Taggnamn'}
                    </Badge>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateTag} disabled={!formData.name}>
                  Skapa Tagg
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Taggar</CardTitle>
            <TagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manuella Taggar</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(t => t.source === 'MANUAL').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automatiska Taggar</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(t => t.source === 'AUTOMATED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <Card key={tag.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge className={getColorClass(tag.color)}>
                  {tag.name}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(tag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="mt-2">
                {tag.description || 'Ingen beskrivning'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{tag._count?.customerTags || 0} kunder</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {tag.source === 'MANUAL' ? 'Manuell' : 
                   tag.source === 'AUTOMATED' ? 'Automatisk' : 'Importerad'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera tagg</DialogTitle>
            <DialogDescription>
              Uppdatera taggens information
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-color">Färg</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.class}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Ikon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-2">
              <Label className="text-sm text-muted-foreground">Förhandsvisning:</Label>
              <div className="mt-2">
                <Badge className={getColorClass(formData.color)}>
                  {formData.name || 'Taggnamn'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>
              Avbryt
            </Button>
            <Button onClick={handleUpdateTag} disabled={!formData.name}>
              Uppdatera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
