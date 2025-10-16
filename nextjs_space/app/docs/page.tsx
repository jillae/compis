import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Video, Code } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="container mx-auto max-w-6xl p-6 py-12 space-y-6">
      <div className="text-center space-y-2">
        <BookOpen className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Dokumentation</h1>
        <p className="text-muted-foreground">
          Lär dig allt om Flow och hur du får ut det mesta av plattformen
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle>Användarguider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/legal/terms" className="block text-sm text-primary hover:underline">
              → Dynamic Pricing Guide
            </Link>
            <Link href="/faq" className="block text-sm text-primary hover:underline">
              → Vanliga Frågor (FAQ)
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Video className="h-8 w-8 text-purple-500 mb-2" />
            <CardTitle>Videoguider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Kommer snart...</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Code className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle>API Dokumentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Kontakta support för API-access</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Behöver du hjälp?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Kontakta vårt support-team för personlig hjälp:
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
