
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  X, 
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { ActionCategory, ActionStatus } from '@prisma/client';

interface ActionStep {
  description: string;
  completed: boolean;
}

interface ActionEvidence {
  metric: string;
  currentValue: number;
  targetValue?: number;
}

interface WeeklyAction {
  id: string;
  priority: number;
  title: string;
  category: ActionCategory;
  expectedImpact: number;
  description: string;
  reasoning: string;
  status: ActionStatus;
  steps: ActionStep[];
  evidence: ActionEvidence[];
}

interface ActionCardProps {
  action: WeeklyAction;
  onUpdate: (actionId: string, updates: any) => Promise<void>;
}

const categoryConfig: Record<ActionCategory, { label: string; color: string; emoji: string }> = {
  CAPACITY_OPTIMIZATION: { label: 'Kapacitet', color: 'bg-blue-500', emoji: '📊' },
  PRICING: { label: 'Prissättning', color: 'bg-green-500', emoji: '💰' },
  MARKETING: { label: 'Marknadsföring', color: 'bg-purple-500', emoji: '📢' },
  SERVICE_MIX: { label: 'Tjänstemix', color: 'bg-orange-500', emoji: '🎯' },
  CUSTOMER_RETENTION: { label: 'Kundbehållning', color: 'bg-pink-500', emoji: '❤️' },
  STAFFING: { label: 'Bemanning', color: 'bg-indigo-500', emoji: '👥' },
};

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'HÖG PRIORITET', color: 'destructive' },
  2: { label: 'MEDIUM PRIORITET', color: 'default' },
  3: { label: 'LÅG PRIORITET', color: 'secondary' },
};

export function ActionCard({ action, onUpdate }: ActionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  const category = categoryConfig[action.category];
  const priority = priorityConfig[action.priority];

  const handleStepToggle = async (stepIndex: number) => {
    setLoading(true);
    const newSteps = [...action.steps];
    newSteps[stepIndex].completed = !newSteps[stepIndex].completed;
    
    // If all steps completed, mark action as completed
    const allCompleted = newSteps.every((s) => s.completed);
    const newStatus = allCompleted ? ActionStatus.COMPLETED : ActionStatus.IN_PROGRESS;

    await onUpdate(action.id, { steps: newSteps, status: newStatus });
    setLoading(false);
  };

  const handleDismiss = async () => {
    if (confirm('Är du säker på att du vill avfärda denna rekommendation?')) {
      setLoading(true);
      await onUpdate(action.id, { 
        status: ActionStatus.DISMISSED,
        dismissReason: 'User dismissed',
      });
      setLoading(false);
    }
  };

  const completedSteps = action.steps.filter((s) => s.completed).length;
  const progress = (completedSteps / action.steps.length) * 100;

  if (action.status === ActionStatus.DISMISSED) {
    return null; // Don't show dismissed actions
  }

  return (
    <Card 
      className={`${
        action.status === ActionStatus.COMPLETED 
          ? 'border-green-500 bg-green-50/50' 
          : action.priority === 1 
          ? 'border-destructive/50 bg-destructive/5'
          : ''
      } transition-all`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={priority.color as any}>
                {category.emoji} {priority.label}
              </Badge>
              <Badge variant="outline">{category.label}</Badge>
              {action.status === ActionStatus.COMPLETED && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> KLAR
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-xl md:text-2xl">{action.title}</CardTitle>
            
            <div className="flex items-center gap-4 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-600">
                  +{action.expectedImpact.toLocaleString('sv-SE')} kr
                </span>
                <span className="text-muted-foreground">förväntat</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {completedSteps}/{action.steps.length} steg klara
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {action.status !== ActionStatus.COMPLETED && (
          <div className="mt-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" /> Vad vi ser i din data
            </h4>
            <p className="text-sm md:text-base text-muted-foreground">{action.description}</p>
          </div>

          {/* Reasoning */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Varför detta är viktigt</h4>
            <p className="text-sm md:text-base">{action.reasoning}</p>
          </div>

          {/* Evidence */}
          {action.evidence.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Nyckeldata</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {action.evidence.map((ev, idx) => (
                  <div key={idx} className="bg-background border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{ev.metric}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{ev.currentValue}</span>
                      {ev.targetValue && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-lg font-semibold text-green-600">{ev.targetValue}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Steps */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Konkreta steg att ta
            </h4>
            <div className="space-y-3">
              {action.steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    step.completed ? 'bg-green-50 border-green-200' : 'bg-background'
                  }`}
                >
                  <Checkbox
                    checked={step.completed}
                    onCheckedChange={() => handleStepToggle(idx)}
                    disabled={loading || action.status === ActionStatus.COMPLETED}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className={`text-sm md:text-base ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          {action.status === ActionStatus.PENDING && completedSteps === 0 && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => handleStepToggle(0)}
              disabled={loading}
            >
              <Zap className="h-5 w-5 mr-2" />
              Börja med första steget
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
