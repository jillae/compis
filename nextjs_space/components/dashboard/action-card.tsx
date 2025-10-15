
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  DollarSign,
  Target,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface ActionCardProps {
  action: {
    id: string;
    priority: number;
    title: string;
    category: string;
    expectedImpact: number;
    description: string;
    reasoning: string;
    status: string;
    steps: Array<{
      description: string;
      completed: boolean;
    }>;
    evidence: Array<{
      metric: string;
      currentValue: number;
      targetValue: number;
    }>;
  };
  onUpdate: (id: string, updates: any) => void;
}

const categoryIcons: Record<string, any> = {
  CAPACITY_OPTIMIZATION: Calendar,
  PRICING: DollarSign,
  MARKETING: TrendingUp,
  SERVICE_MIX: Target,
  CUSTOMER_RETENTION: Users,
  STAFFING: Clock,
};

const categoryLabels: Record<string, string> = {
  CAPACITY_OPTIMIZATION: 'Kapacitetsoptimering',
  PRICING: 'Prissättning',
  MARKETING: 'Marknadsföring',
  SERVICE_MIX: 'Tjänstemix',
  CUSTOMER_RETENTION: 'Kundretention',
  STAFFING: 'Bemanning',
};

const priorityColors: Record<number, string> = {
  1: 'border-l-4 border-red-500',
  2: 'border-l-4 border-orange-500',
  3: 'border-l-4 border-yellow-500',
};

export function ActionCard({ action, onUpdate }: ActionCardProps) {
  const [expanded, setExpanded] = useState(action.priority === 1); // Auto-expand critical
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const CategoryIcon = categoryIcons[action.category] || Sparkles;
  
  const completedSteps = action.steps.filter(s => s.completed).length;
  const totalSteps = action.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handleStepToggle = (stepIndex: number) => {
    const updatedSteps = [...action.steps];
    updatedSteps[stepIndex].completed = !updatedSteps[stepIndex].completed;
    
    // Check if all steps are completed
    const allCompleted = updatedSteps.every(s => s.completed);
    const newStatus = allCompleted ? 'COMPLETED' : 'IN_PROGRESS';
    
    onUpdate(action.id, {
      steps: updatedSteps,
      status: newStatus,
    });
  };

  const handleDismiss = () => {
    onUpdate(action.id, {
      status: 'DISMISSED',
      dismissReason,
    });
    setShowDismissDialog(false);
  };

  const handleReactivate = () => {
    onUpdate(action.id, {
      status: 'PENDING',
      dismissReason: null,
    });
  };

  return (
    <>
      <Card className={`${priorityColors[action.priority]} ${action.status === 'DISMISSED' ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CategoryIcon className="h-5 w-5 text-blue-600" />
                <Badge variant="outline">
                  {categoryLabels[action.category] || action.category}
                </Badge>
                {action.status === 'COMPLETED' && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Slutförd
                  </Badge>
                )}
                {action.status === 'DISMISSED' && (
                  <Badge variant="secondary">
                    <X className="h-3 w-3 mr-1" />
                    Avvisad
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold text-green-600">
                    +{Math.round(action.expectedImpact).toLocaleString('sv-SE')} kr
                  </span>
                  <span className="text-gray-500">potentiell impact</span>
                </div>
                {action.status !== 'DISMISSED' && action.status !== 'COMPLETED' && (
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{completedSteps}/{totalSteps} steg</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {action.status === 'DISMISSED' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivate}
                >
                  Återaktivera
                </Button>
              ) : action.status !== 'COMPLETED' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDismissDialog(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            {/* Description */}
            <div>
              <p className="text-gray-700 mb-2">{action.description}</p>
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Analys:</strong> {action.reasoning}
                </AlertDescription>
              </Alert>
            </div>

            {/* Evidence/Metrics */}
            {action.evidence && action.evidence.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">📊 Nyckeltal</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {action.evidence.map((ev, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{ev.metric}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold">
                          {ev.currentValue.toLocaleString('sv-SE')}
                        </span>
                        <span className="text-xs text-gray-500">→</span>
                        <span className="text-sm text-green-600">
                          {ev.targetValue.toLocaleString('sv-SE')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Steps */}
            {action.status !== 'DISMISSED' && (
              <div>
                <h4 className="font-semibold text-sm mb-2">✅ Åtgärdssteg</h4>
                {totalSteps > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Framsteg</span>
                      <span>{completedSteps}/{totalSteps} ({Math.round(progress)}%)</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                <div className="space-y-2">
                  {action.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={`step-${action.id}-${idx}`}
                        checked={step.completed}
                        onCheckedChange={() => handleStepToggle(idx)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`step-${action.id}-${idx}`}
                        className={`text-sm flex-1 cursor-pointer ${
                          step.completed ? 'line-through text-gray-500' : 'text-gray-700'
                        }`}
                      >
                        {step.description}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Dismiss Dialog */}
      <AlertDialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avvisa rekommendation?</AlertDialogTitle>
            <AlertDialogDescription>
              Du kan alltid återaktivera denna rekommendation senare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Varför väljer du att inte följa denna rekommendation? (valfritt)"
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismiss}>
              Avvisa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
