
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Cookie, Info, Settings, Shield } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6 py-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <Cookie className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Cookie-policy</h1>
        <p className="text-muted-foreground">
          Senast uppdaterad: 16 oktober 2025
        </p>
      </div>

      <Separator />

      {/* What are cookies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Vad är cookies?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cookies är små textfiler som sparas på din dator eller mobila enhet när
            du besöker en webbplats. De hjälper webbplatsen att komma ihåg
            information om ditt besök, som föredragna inställningar och
            språkval.
          </p>
          <p className="text-sm text-muted-foreground">
            Flow använder cookies för att förbättra din upplevelse och för att
            tillhandahålla grundläggande funktionalitet på plattformen.
          </p>
        </CardContent>
      </Card>

      {/* Types of cookies we use */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cookies vi använder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">1. Nödvändiga cookies</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Dessa cookies är nödvändiga för att webbplatsen ska fungera och
              kan inte stängas av i våra system.
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div><strong>next-auth.session-token:</strong> Autentisering och inloggning</div>
              <div><strong>next-auth.csrf-token:</strong> Säkerhet mot CSRF-attacker</div>
              <div><strong>Livslängd:</strong> Session (raderas när du stänger webbläsaren)</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Funktionella cookies</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Dessa cookies gör det möjligt för webbplatsen att komma ihåg val
              du gör (som ditt användarnamn eller språkval).
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div><strong>theme:</strong> Sparar ditt val av ljust/mörkt tema</div>
              <div><strong>Livslängd:</strong> 1 år</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Prestanda-cookies</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Dessa cookies hjälper oss att förstå hur besökare interagerar med
              webbplatsen genom att samla in och rapportera information
              anonymt.
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div><strong>_ga:</strong> Google Analytics - Identifierar unika användare</div>
              <div><strong>_gid:</strong> Google Analytics - Identifierar unika användare</div>
              <div><strong>Livslängd:</strong> 2 år (_ga), 24 timmar (_gid)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Third-party cookies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tredjepartscookies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Flow använder följande tredjepartstjänster som kan sätta cookies:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Google Analytics:</strong> För att analysera användning och
              förbättra tjänsten. Se{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Googles sekretesspolicy
              </a>
            </li>
            <li>
              <strong>Vercel Analytics:</strong> För att mäta prestanda och
              tillgänglighet
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Managing cookies */}
      <Card>
        <CardHeader>
          <CardTitle>Hantera cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Du kan när som helst ändra dina cookie-inställningar genom att:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Använda inställningarna i din webbläsare</li>
            <li>
              Besöka{" "}
              <a
                href="https://www.aboutcookies.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.aboutcookies.org
              </a>{" "}
              för instruktioner om hur du blockerar cookies
            </li>
            <li>
              Använda{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
            </li>
          </ul>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Observera:</strong> Om du blockerar nödvändiga cookies kan vissa
            delar av Flow sluta fungera korrekt.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Har du frågor om vår cookie-policy? Kontakta oss på{" "}
            <a
              href="mailto:support@klinikflow.se"
              className="text-primary hover:underline"
            >
              support@klinikflow.se
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
