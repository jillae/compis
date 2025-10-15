

'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface UnlayerEmailEditorProps {
  onReady?: () => void;
  onDesignLoad?: (data: any) => void;
  initialDesign?: any;
  plan?: string;
  apiKey?: string | null;
}

export function UnlayerEmailEditor({ 
  onReady, 
  onDesignLoad, 
  initialDesign,
  plan = 'FREE',
  apiKey = null 
}: UnlayerEmailEditorProps) {
  const emailEditorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editorLoaded, setEditorLoaded] = useState(false);

  useEffect(() => {
    // Load Unlayer script
    const script = document.createElement('script');
    script.src = 'https://editor.unlayer.com/embed.js';
    script.async = true;
    
    script.onload = () => {
      initializeEditor();
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializeEditor = () => {
    if (typeof window !== 'undefined' && (window as any).unlayer) {
      const unlayer = (window as any).unlayer;

      const options: any = {
        id: 'unlayer-editor',
        displayMode: 'email',
        projectId: apiKey ? undefined : undefined, // Use project ID for paid plans if needed
      };

      // Add API key for paid plans
      if (apiKey && plan !== 'FREE') {
        options.apiKey = apiKey;
      }

      unlayer.init(options);

      emailEditorRef.current = unlayer;

      // Load initial design if provided
      if (initialDesign) {
        unlayer.loadDesign(initialDesign);
      }

      // Set ready state
      unlayer.addEventListener('editor:ready', () => {
        setIsLoading(false);
        setEditorLoaded(true);
        if (onReady) {
          onReady();
        }
      });

      // Listen for design changes
      unlayer.addEventListener('design:updated', (data: any) => {
        if (onDesignLoad) {
          unlayer.exportHtml((data: any) => {
            onDesignLoad(data);
          });
        }
      });
    }
  };

  const exportHtml = () => {
    return new Promise((resolve, reject) => {
      if (emailEditorRef.current) {
        emailEditorRef.current.exportHtml((data: any) => {
          resolve(data);
        });
      } else {
        reject(new Error('Editor not initialized'));
      }
    });
  };

  const saveDesign = () => {
    return new Promise((resolve, reject) => {
      if (emailEditorRef.current) {
        emailEditorRef.current.saveDesign((design: any) => {
          resolve(design);
        });
      } else {
        reject(new Error('Editor not initialized'));
      }
    });
  };

  const loadDesign = (design: any) => {
    if (emailEditorRef.current) {
      emailEditorRef.current.loadDesign(design);
    }
  };

  return (
    <div className="w-full">
      {/* Plan Badge */}
      <Card className="mb-4">
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {plan === 'FREE' ? (
              <Badge variant="outline" className="bg-gray-100">
                <span className="text-xs">Unlayer Free Mode</span>
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">
                <span className="text-xs">✓ Unlayer Pro Active ({plan})</span>
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {plan === 'FREE' 
                ? 'Tillgång till grundläggande mallar och funktioner'
                : 'Tillgång till premium-mallar och avancerade funktioner'
              }
            </span>
          </div>
          {plan === 'FREE' && (
            <Button variant="outline" size="sm" className="text-xs">
              Uppgradera till Pro
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Editor Container */}
      <div className="relative bg-white border rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Laddar editor...</p>
            </div>
          </div>
        )}
        <div id="unlayer-editor" style={{ height: '600px' }}></div>
      </div>
    </div>
  );
}

// Export methods to be used by parent components
export const getEditorMethods = (ref: React.RefObject<any>) => ({
  exportHtml: () => {
    return new Promise((resolve) => {
      if (ref.current) {
        ref.current.exportHtml((data: any) => {
          resolve(data);
        });
      }
    });
  },
  saveDesign: () => {
    return new Promise((resolve) => {
      if (ref.current) {
        ref.current.saveDesign((design: any) => {
          resolve(design);
        });
      }
    });
  },
  loadDesign: (design: any) => {
    if (ref.current) {
      ref.current.loadDesign(design);
    }
  },
});

