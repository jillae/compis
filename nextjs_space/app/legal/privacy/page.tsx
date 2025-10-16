
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Lock, Database, Share2, UserCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6 py-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Sekretess- och personuppgiftspolicy</h1>
        <p className="text-muted-foreground">
          Senast uppdaterad: 16 oktober 2025
        </p>
      </div>

      <Separator />

      {/* 2.1 Insamling av personuppgifter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            2.1 Insamling av personuppgifter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Flow samlar in namn, e-post, organisationsnummer och transaktionsdata
            för att tillhandahålla våra tjänster.
          </p>
        </CardContent>
      </Card>

      {/* 2.2 Ändamål */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            2.2 Ändamål
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Hantering av användarkonton</li>
            <li>Fakturering och betalningshantering</li>
            <li>Kundservice och support</li>
            <li>Juridisk efterlevnad och regelefterlevnad</li>
          </ul>
        </CardContent>
      </Card>

      {/* 2.3 Lagring och säkerhet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            2.3 Lagring och säkerhet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold mb-2">Var lagras data?</h3>
            <p className="text-sm text-muted-foreground">
              Uppgifter lagras krypterat i EU/EES i enlighet med GDPR.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Säkerhetsåtgärder</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>End-to-end kryptering för känslig data</li>
              <li>Regelbundna säkerhetsgranskningar</li>
              <li>Incidentrapportering och beredskapsplaner</li>
              <li>Åtkomstkontroll och behörighetshantering</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 2.4 Delning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            2.4 Delning av personuppgifter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Flow delar <strong>inte</strong> personuppgifter med tredje part utan
            ditt samtycke.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              Undantag
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Vi kan dela uppgifter med betrodda leverantörer som agerar på våra
              instruktioner (t.ex. betalningsleverantörer, hosting-tjänster) för
              att leverera våra tjänster.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2.5 Användarens rättigheter */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            2.5 Användarens rättigheter (GDPR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm text-muted-foreground">
            Enligt GDPR har du rätt att:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Rätt till tillgång:</strong> Begära information om vilka
              personuppgifter vi behandlar om dig.
            </li>
            <li>
              <strong>Rätt till rättelse:</strong> Begära att felaktiga uppgifter
              korrigeras.
            </li>
            <li>
              <strong>Rätt till radering:</strong> Begära att dina personuppgifter
              raderas (med vissa undantag för juridiska krav).
            </li>
            <li>
              <strong>Rätt till dataportabilitet:</strong> Få en kopia av dina data
              i strukturerad, maskinläsbar form.
            </li>
            <li>
              <strong>Rätt att invända:</strong> Invända mot behandling av dina
              personuppgifter i vissa fall.
            </li>
          </ul>

          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              För att utöva dina rättigheter, kontakta oss på{" "}
              <a
                href="mailto:privacy@flow.se"
                className="font-semibold underline"
              >
                privacy@flow.se
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Kontaktinformation */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold">Personuppgiftsansvarig</p>
            <p className="text-sm text-muted-foreground">
              Flow AB
              <br />
              Org.nr: [XXX-XXXXXX]
              <br />
              E-post:{" "}
              <a href="mailto:privacy@flow.se" className="underline">
                privacy@flow.se
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
