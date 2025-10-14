
'use client';

import { useState } from 'react';
import AIChatWidget from '@/components/ai-chat-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function AIAssistantPage() {
  const [customerId, setCustomerId] = useState('');
  const [phone, setPhone] = useState('');
  const [showWidget, setShowWidget] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;

    try {
      // Fetch customer by phone
      const response = await fetch(`/api/payatt/cards?phone=${phone}`);
      const data = await response.json();
      
      if (data.cards && data.cards.length > 0) {
        setCustomerId(data.cards[0].customerId);
        setShowWidget(true);
      }
    } catch (error) {
      console.error('Customer search error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Kundtjänst med Röst
          </h1>
          <p className="text-gray-600 text-lg">
            Ställ frågor om ditt lojalitetsprogram och få svar med röst!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sök Kund</CardTitle>
            <CardDescription>
              Ange mobilnummer för att få personlig assistans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="070-123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Sök
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>🎤 Röstassistent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                AI-assistenten kan läsa upp svar med hjälp av Text-to-Speech teknologi.
                Klicka på högtalar-ikonen för att höra svaret.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💬 Smart Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Ställ frågor om dina stämplar, belöningar, eller hur programmet fungerar.
                AI-assistenten har tillgång till din kundinformation.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">Exempel på frågor:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Hur många stämplar har jag?</li>
                <li>När kan jag få min belöning?</li>
                <li>Hur fungerar lojalitetsprogrammet?</li>
                <li>Hur bokar jag en tid?</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Widget */}
      {showWidget && <AIChatWidget customerId={customerId} />}
    </div>
  );
}
