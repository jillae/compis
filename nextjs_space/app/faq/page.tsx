import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6 py-12 space-y-6">
      <div className="text-center space-y-2">
        <HelpCircle className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Vanliga Frågor (FAQ)</h1>
        <p className="text-muted-foreground">
          Hitta svar på de vanligaste frågorna om Flow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Allmänt</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Vad är Flow?</AccordionTrigger>
              <AccordionContent>
                Flow är en intelligent revenue intelligence-plattform för skönhets- och hälsokliniker, driven av Corex.
                Vi hjälper dig optimera intäkter, reducera no-shows och förbättra kundupplevelsen genom
                proaktiva insikter och automatisering.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Hur mycket kostar Flow?</AccordionTrigger>
              <AccordionContent>
                Flow finns i tre prisnivåer: Basic (499 kr/månad), Professional (1499 kr/månad) och
                Enterprise (2999+ kr/månad). Vi erbjuder 14 dagars gratis provperiod för alla planer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Hur kommer jag igång?</AccordionTrigger>
              <AccordionContent>
                Registrera dig för ett gratis konto, anslut ditt Bokadirekt-konto och Flow börjar
                automatiskt analysera din data. Du får dina första insikter inom 24 timmar.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funktioner</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-4">
              <AccordionTrigger>Vad är Dynamic Pricing?</AccordionTrigger>
              <AccordionContent>
                Dynamic Pricing justerar dina priser automatiskt baserat på efterfrågan och kapacitet.
                Se vår{" "}
                <a href="/legal/terms" className="text-primary hover:underline">
                  användarguide
                </a>{" "}
                för mer information.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Hur fungerar Customer Health Score?</AccordionTrigger>
              <AccordionContent>
                Vi analyserar kundbeteende (frekvens, monetärt värde, engagemang) för att identifiera
                kunder i riskzonen innan de försvinner. Du får proaktiva varningar och åtgärdsförslag.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Kan jag integrera med andra system?</AccordionTrigger>
              <AccordionContent>
                Ja! Flow integrerar med Bokadirekt, Meta Ads, Corex och fler. Vi lägger kontinuerligt
                till nya integrationer baserat på kundönskemål.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support & Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hittar du inte svar på din fråga? Kontakta oss:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              Email:{" "}
              <a href="mailto:support@klinikflow.se" className="text-primary hover:underline">
                support@klinikflow.se
              </a>
            </li>
            <li>Telefon: +46 (0)31-123 45 67</li>
            <li>Öppettider: Mån-Fre 09:00-17:00</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
