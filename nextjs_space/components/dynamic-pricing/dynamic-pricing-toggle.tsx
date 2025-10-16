
"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Info, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { DynamicPricingWhitepaper } from "./dynamic-pricing-whitepaper";

interface DynamicPricingStatus {
  enabled: boolean;
  lastToggled: string | null;
  daysSinceLastToggle: number | null;
  canUsePriceComparisons: boolean;
}

interface DynamicPricingToggleProps {
  onStatusChange?: (status: DynamicPricingStatus) => void;
}

export function DynamicPricingToggle({ onStatusChange }: DynamicPricingToggleProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<DynamicPricingStatus>({
    enabled: false,
    lastToggled: null,
    daysSinceLastToggle: null,
    canUsePriceComparisons: false,
  });

  // Dialog states
  const [showWhitepaper, setShowWhitepaper] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  // Fetch current status
  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/clinic/dynamic-pricing");
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatus(data);
      onStatusChange?.(data);
    } catch (error) {
      console.error("Error fetching Dynamic Pricing status:", error);
      toast.error("Kunde inte hämta Dynamic Pricing-status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleClick = () => {
    if (status.enabled) {
      // Disabling
      setShowDisableDialog(true);
    } else {
      // Enabling
      setShowEnableDialog(true);
    }
  };

  const handleToggle = async (enable: boolean) => {
    setUpdating(true);
    try {
      const response = await fetch("/api/clinic/dynamic-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: enable, acknowledged: true }),
      });

      if (!response.ok) throw new Error("Failed to toggle Dynamic Pricing");

      const data = await response.json();
      setStatus(data);
      onStatusChange?.(data);

      toast.success(
        enable
          ? "Dynamic Pricing aktiverat"
          : "Dynamic Pricing avaktiverat"
      );

      setShowEnableDialog(false);
      setShowDisableDialog(false);
    } catch (error) {
      console.error("Error toggling Dynamic Pricing:", error);
      toast.error("Kunde inte ändra Dynamic Pricing-status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Laddar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle with status indicator */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Dynamic Pricing Intelligence</span>
            <Badge
              variant={status.enabled ? "default" : "secondary"}
              className="text-xs"
            >
              {status.enabled ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
          
          {status.daysSinceLastToggle !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {status.enabled ? "Aktivt i" : "Inaktivt i"} {status.daysSinceLastToggle} dagar
              </span>
            </div>
          )}
        </div>

        <Switch
          checked={status.enabled}
          onCheckedChange={handleToggleClick}
          disabled={updating}
        />
      </div>

      {/* Legal compliance warning */}
      {status.enabled && status.daysSinceLastToggle !== null && status.daysSinceLastToggle < 28 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Observera:</strong> Det har gått {status.daysSinceLastToggle} dagar sedan
            senaste prisändring. För att marknadsföra med prisjämförelser eller
            "rea" behöver priset vara stabilt i minst 28 dagar. Återstående:{" "}
            <strong>{28 - status.daysSinceLastToggle} dagar</strong>
          </AlertDescription>
        </Alert>
      )}

      {status.enabled && status.canUsePriceComparisons && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800 dark:text-green-200">
            Du kan nu använda prisjämförelser i marknadsföringen (priset har varit
            stabilt i över 28 dagar).
          </AlertDescription>
        </Alert>
      )}

      {/* Whitepaper link */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setShowWhitepaper(true)}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Läs mer: Whitepaper för klinikägare
      </Button>

      {/* Whitepaper Dialog */}
      <Dialog open={showWhitepaper} onOpenChange={setShowWhitepaper}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dynamic Pricing Whitepaper</DialogTitle>
            <DialogDescription>
              Förstå och aktivera Dynamic Pricing på rätt sätt
            </DialogDescription>
          </DialogHeader>
          <DynamicPricingWhitepaper />
          <DialogFooter>
            <Button onClick={() => setShowWhitepaper(false)}>Stäng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable Dialog */}
      <AlertDialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktivera Dynamic Pricing?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong>Kom ihåg:</strong> Vid dynamiska priser ska du undvika
                marknadsföring med 'rea', 'rabatt' eller 'ordinarie pris'.
              </p>
              <p className="text-sm">
                Prisjämförelser får endast användas om priset varit stabilt i minst
                28 dagar.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggle(true)}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aktivera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avaktivera Dynamic Pricing?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {status.daysSinceLastToggle !== null && status.daysSinceLastToggle < 28 ? (
                <>
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                      ⚠️ Observera
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Det har gått mindre än 28 dagar sedan senaste prisändring (
                      {status.daysSinceLastToggle} dagar).
                    </p>
                  </div>
                  <p className="text-sm">
                    För att kunna marknadsföra med prisjämförelser eller 'rea' behöver
                    priset vara stabilt i minst 28 dagar. Vill du fortsätta?
                  </p>
                </>
              ) : (
                <p>Är du säker på att du vill avaktivera Dynamic Pricing?</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggle(false)}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Avaktivera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
