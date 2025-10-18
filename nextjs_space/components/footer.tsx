
'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Separator } from '@/components/ui/separator';
import { HeartPulse } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: session } = useSession() || {};
  const isAuthenticated = !!session?.user;

  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Flow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Intelligent intäktsoptimering driven av Corex
            </p>
          </div>

          {/* Product - Only show dashboard links for authenticated users */}
          {isAuthenticated ? (
            <div>
              <h3 className="font-semibold mb-3 text-sm">Produkt</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/insights" className="text-muted-foreground hover:text-primary transition-colors">
                    Revenue Intelligence
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/customers" className="text-muted-foreground hover:text-primary transition-colors">
                    Customer Health
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/marketing" className="text-muted-foreground hover:text-primary transition-colors">
                    Marketing Automation
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-3 text-sm">Produkt</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#features" className="text-muted-foreground hover:text-primary transition-colors">
                    Funktioner
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Priser
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors">
                    Dokumentation
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@klinikflow.se" className="text-muted-foreground hover:text-primary transition-colors">
                    Kontakt
                  </a>
                </li>
              </ul>
            </div>
          )}

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@klinikflow.se" className="text-muted-foreground hover:text-primary transition-colors">
                  Kontakta oss
                </a>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors">
                  Dokumentation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Juridiskt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Användarvillkor
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Integritetspolicy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie-policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Flow AB. Alla rättigheter förbehållna.</p>
          <div className="flex items-center gap-4">
            <span>Org.nr: 559999-9999</span>
            <span className="hidden md:inline">•</span>
            <span>Göteborg, Sverige</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
