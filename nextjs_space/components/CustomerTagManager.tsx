
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Tag as TagIcon } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface CustomerTag {
  id: string;
  tag: Tag;
}

interface CustomerTagManagerProps {
  customerId: string;
  initialTags?: CustomerTag[];
}

export function CustomerTagManager({ customerId, initialTags = [] }: CustomerTagManagerProps) {
  const { toast } = useToast();
  const [customerTags, setCustomerTags] = useState<CustomerTag[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleAddTag = async (tagId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/customers/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          tagIds: [tagId],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newTag = availableTags.find(t => t.id === tagId);
        if (newTag) {
          setCustomerTags([...customerTags, { id: result.tagged[0], tag: newTag }]);
          toast({
            title: 'Tagg tillagd',
            description: `Taggen "${newTag.name}" har lagts till`,
          });
        }
        setIsAddDialogOpen(false);
      } else {
        throw new Error('Failed to add tag');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till tagg',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (customerTagId: string) => {
    try {
      const response = await fetch(`/api/customers/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          tagIds: [customerTags.find(ct => ct.id === customerTagId)?.tag.id],
        }),
      });

      if (response.ok) {
        const removedTag = customerTags.find(ct => ct.id === customerTagId);
        setCustomerTags(customerTags.filter(ct => ct.id !== customerTagId));
        toast({
          title: 'Tagg borttagen',
          description: `Taggen "${removedTag?.tag.name}" har tagits bort`,
        });
      } else {
        throw new Error('Failed to remove tag');
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort tagg',
        variant: 'destructive',
      });
    }
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

  const unassignedTags = availableTags.filter(
    tag => !customerTags.some(ct => ct.tag.id === tag.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Taggar
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Lägg till
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {customerTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga taggar ännu</p>
        ) : (
          customerTags.map((ct) => (
            <Badge
              key={ct.id}
              className={`${getColorClass(ct.tag.color)} flex items-center gap-1`}
            >
              {ct.tag.name}
              <button
                onClick={() => handleRemoveTag(ct.id)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till tagg</DialogTitle>
            <DialogDescription>
              Välj en tagg att lägga till för denna kund
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {unassignedTags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Alla tillgängliga taggar är redan tillagda
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {unassignedTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleAddTag(tag.id)}
                    disabled={loading}
                  >
                    <Badge className={getColorClass(tag.color)}>
                      {tag.name}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Stäng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
