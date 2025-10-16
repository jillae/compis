
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BookOpen, Scale, ShieldCheck, Clock } from "lucide-react";

export function DynamicPricingWhitepaper() {
  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <BookOpen className="h-12 w-12 mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Dynamic Pricing Intelligence</h2>
          <p className="text-muted-foreground">
            Whitepaper för klinikägare – förstå och aktivera
          </p>
        </div>

        <Separator />

        {/* Vad är Dynamic Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Vad är Dynamic Pricing?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Dynamic Pricing innebär att dina priser anpassas automatiskt efter
              marknadsläget och efterfrågan. I Flow styr du detta enkelt via en
              on/off-knapp.
            </p>
          </CardContent>
        </Card>

        {/* Viktigt när du prissätter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Viktigt när du prissätter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="font-medium">Var tydlig med aktuell prisinformation</p>
              <p className="text-sm text-muted-foreground">
                Kunden ska alltid se det aktuella priset tydligt.
              </p>
            </div>

            <div className="space-y-2 bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                ⚠️ Undvik missvisande marknadsföring
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Använd <strong>inte</strong> termer som "rea", "rabatt" eller
                "ordinarie pris" när Dynamic Pricing är igång – enligt svensk lag
                måste sådana uttryck bygga på att ett stabilt, normalt pris faktiskt
                funnits under längre tid.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Om priser ändras ofta eller snabbt kan man inte på ett korrekt sätt
                visa ett "ordinarie pris" eller använda påståenden om fasta rabatter
                som "20% rabatt". Sådan marknadsföring kan betraktas som vilseledande.
              </p>
            </div>

            <div className="space-y-2 bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-medium text-green-900 dark:text-green-100">
                ✓ Rätt kommunikation
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                Lyft gärna att kunden alltid får ett <strong>aktuellt och rättvist pris</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vad säger lagen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Vad säger lagen?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Dynamic Pricing är <strong>fullt lagligt i Sverige</strong>, men
              marknadsföring kring prisnedsättningar är strikt reglerad.
            </p>
            <p className="text-sm text-muted-foreground">
              Priset måste alltid presenteras tydligt, och jämförelser med ordinarie
              pris får bara göras om det funnits ett stabilt ordinarie pris under
              längre tid.
            </p>
          </CardContent>
        </Card>

        {/* Ansvar & trygghet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Ansvar & trygghet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>
                Som klinikägare ansvarar du för att informera kunden tydligt om att
                priset kan variera och hålla koll på relevanta regler.
              </li>
              <li>
                Flow hjälper dig att hantera prisändringar på ett smidigt och modernt
                sätt, men beslut och informationsansvar ligger hos dig.
              </li>
              <li>
                Detta whitepaper är tänkt som vägledning och inspiration – behovet av
                ytterligare information eller rådgivning avgör du själv utifrån din
                verksamhet.
              </li>
              <li>Håll dig uppdaterad om relevanta regler ändras.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Rekommenderat intervall */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Rekommenderat intervall vid prisväxling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              För att kunna använda marknadsföring med prisjämförelser (t.ex. "rea"
              eller "ordinarie pris") krävs enligt Konsumentverkets vägledning att
              priset har varit stabilt under minst <strong>fyra veckor (28 dagar)</strong>{" "}
              innan det ändras.
            </p>

            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  📅 Minsta rekommenderade intervall
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  4 veckor (28 dagar)
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                  ⚡ Om du växlar oftare
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Använd endast aktuellt pris i kommunikationen – inga jämförelser
                  med tidigare priser eller "rabatt"-påståenden.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground italic pt-4">
          <p>Du bestämmer när. Flow håller priserna uppdaterade – enkelt och transparent.</p>
        </div>
      </div>
    </ScrollArea>
  );
}
