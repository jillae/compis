
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Scale, FileText, AlertCircle, Clock, CreditCard } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6 py-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <Scale className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Användarvillkor</h1>
        <p className="text-muted-foreground">
          Senast uppdaterad: 16 oktober 2025
        </p>
      </div>

      <Separator />

      {/* 1. Allmänna användarvillkor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Allmänna användarvillkor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1.1 Parter och Tillämpning</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>
                Dessa villkor reglerar avtal mellan Klinikägaren ("Användaren") och
                Flow AB ("Leverantören").
              </li>
              <li>
                Villkoren gäller för användning av samtliga tjänster i
                Flow-plattformen.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">1.2 Användarens åtaganden</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Användaren ansvarar för att all information är korrekt.</li>
              <li>
                Användaren ska följa tillämpliga lagar, regler och god sed.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">1.3 Leverantörens åtaganden</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>
                Flow tillhandahåller tjänster med överenskommen funktionalitet.
              </li>
              <li>Support och underhåll enligt separat SLA.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">1.4 Ansvarsbegränsning</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Flow ansvarar ej för indirekta skador eller följdskador.</li>
              <li>
                Total ansvarsskyldighet per kalenderår är begränsad till
                avgifterna betalda under året.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">1.5 Avtalstid och uppsägning</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>
                Avtal träder i kraft vid registrering och löper tills vidare.
              </li>
              <li>Uppsägningstid är 30 dagar.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 2. Sekretess och personuppgifter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            2. Sekretess- och personuppgiftspolicy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">2.1 Insamling av personuppgifter</h3>
            <p className="text-sm text-muted-foreground">
              Flow samlar in namn, e-post, organisationsnummer och transaktionsdata
              för att tillhandahålla tjänsten.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2.2 Ändamål</h3>
            <p className="text-sm text-muted-foreground">
              Personuppgifter används för hantering av användarkonton, fakturering,
              kundservice och juridisk efterlevnad.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2.3 Lagring och säkerhet</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Uppgifter lagras krypterat inom EU/EES</li>
              <li>Regelbundna säkerhetsgranskningar genomförs</li>
              <li>Incidentrapportering enligt GDPR</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2.4 Delning</h3>
            <p className="text-sm text-muted-foreground">
              Flow delar inte personuppgifter med tredje part utan samtycke, förutom
              med underleverantörer som agerar enligt våra instruktioner.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2.5 Användarens rättigheter</h3>
            <p className="text-sm text-muted-foreground">
              Du har rätt att begära tillgång till, rättelse eller radering av dina
              personuppgifter enligt GDPR. Kontakta{" "}
              <a href="mailto:privacy@klinikflow.se" className="text-primary hover:underline">
                privacy@klinikflow.se
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Specifika villkor för Dynamic Pricing */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            3. Specifika villkor för Dynamic Pricing Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h3 className="font-semibold mb-2">3.1 Funktion</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>
                Användaren kan slå Dynamic Pricing på eller av via Flow.
              </li>
              <li>
                Prisjusteringar sker automatiskt enligt marknadsdata.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3.2 Laglighet och ansvar</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Dynamic Pricing är lagligt i Sverige.</li>
              <li>
                Användaren ansvarar för att följa marknadsföringslagen:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    Ej använda termer som "rea", "rabatt" eller "ordinarie pris"
                    om priset inte varit stabilt minst 28 dagar.
                  </li>
                  <li>
                    Endast kommunicera aktuellt pris vid frekventa ändringar.
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold mb-2 text-amber-900 dark:text-amber-100">
              3.3 Friskrivning
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-amber-800 dark:text-amber-200">
              <li>
                Flow friskriver sig från ansvar vid eventuella rättsliga följder
                av Dynamic Pricing.
              </li>
              <li>
                Användaren ansvarar för kundinformation och marknadsföring.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3.4 Loggning</h3>
            <p className="text-sm text-muted-foreground">
              Systemet loggar tidpunkt för aktivering och avaktivering för att
              beräkna 28-dagarsperiod.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tekniska driftsvillkor (SLA) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            4. Tekniska driftsvillkor (SLA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">4.1 Tillgänglighet</h3>
            <p className="text-sm text-muted-foreground">
              Mål 99,5 % driftstid per månad.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4.2 Supportnivåer</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Normal support: svar inom 24 timmar.</li>
              <li>Kritisk incident: svar inom 2 timmar.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4.3 Underhåll</h3>
            <p className="text-sm text-muted-foreground">
              Regelbundna underhållsfönster med minst 72 timmars varsel.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Betalnings- och faktureringsvillkor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            5. Betalnings- och faktureringsvillkor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">5.1 Pris och avgifter</h3>
            <p className="text-sm text-muted-foreground">
              Abonnemangsavgift enligt gällande prislista.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5.2 Faktureringsperiod</h3>
            <p className="text-sm text-muted-foreground">
              Fakturering sker månadsvis i efterskott.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5.3 Betalningsvillkor</h3>
            <p className="text-sm text-muted-foreground">
              30 dagar netto. Påminnelseavgift 50 SEK, dröjsmålsränta enligt
              räntelagen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer disclaimer */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground italic text-center">
            Dessa villkor levereras som utkast och kan komma att uppdateras.
            Kontakta Flow AB för frågor eller förtydliganden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
