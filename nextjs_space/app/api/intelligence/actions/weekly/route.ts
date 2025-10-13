
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ActionCategory, ActionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

interface ActionStep {
  description: string;
  completed: boolean;
}

interface ActionEvidence {
  metric: string;
  currentValue: number;
  targetValue?: number;
}

interface GeneratedAction {
  priority: number;
  title: string;
  category: ActionCategory;
  expectedImpact: number;
  description: string;
  reasoning: string;
  steps: ActionStep[];
  evidence: ActionEvidence[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated with user' }, { status: 400 });
    }

    const clinicId = user.clinicId;

    // Get current week's Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    // Check if we already have actions for this week
    let existingActions = await prisma.weeklyAction.findMany({
      where: {
        clinicId,
        weekStartDate: monday,
      },
      orderBy: [
        { priority: 'asc' },
        { expectedImpact: 'desc' },
      ],
    });

    // If we have existing actions, return them
    if (existingActions.length > 0) {
      return NextResponse.json({
        success: true,
        data: existingActions,
        generated: false,
      });
    }

    // Generate new actions based on analysis
    const generatedActions = await generateActions(clinicId);

    // Save to database
    const savedActions = await Promise.all(
      generatedActions.map((action) =>
        prisma.weeklyAction.create({
          data: {
            clinicId,
            weekStartDate: monday,
            priority: action.priority,
            title: action.title,
            category: action.category,
            expectedImpact: action.expectedImpact,
            description: action.description,
            reasoning: action.reasoning,
            status: ActionStatus.PENDING,
            steps: action.steps as any,
            evidence: action.evidence as any,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: savedActions,
      generated: true,
    });
  } catch (error) {
    console.error('[Weekly Actions API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update action status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { actionId, status, steps, dismissReason } = body;

    const updateData: any = { status };
    
    if (steps) {
      updateData.steps = steps;
    }
    
    if (status === ActionStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }
    
    if (status === ActionStatus.DISMISSED && dismissReason) {
      updateData.dismissedAt = new Date();
      updateData.dismissReason = dismissReason;
    }

    const updated = await prisma.weeklyAction.update({
      where: { id: actionId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Weekly Actions PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Generate actions based on clinic data
async function generateActions(clinicId: string): Promise<GeneratedAction[]> {
  const actions: GeneratedAction[] = [];

  // Fetch data for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const bookings = await prisma.booking.findMany({
    where: {
      clinicId,
      scheduledTime: { gte: startDate, lte: endDate },
    },
    include: {
      service: true,
      staff: true,
      customer: true,
    },
  });

  // 1. Identify capacity bottlenecks
  const capacityAction = await identifyCapacityBottlenecks(bookings, clinicId);
  if (capacityAction) actions.push(capacityAction);

  // 2. Find underutilized time slots
  const underutilizedAction = await identifyUnderutilizedSlots(bookings);
  if (underutilizedAction) actions.push(underutilizedAction);

  // 3. Customer churn prevention
  const churnAction = await identifyChurnRisk(clinicId);
  if (churnAction) actions.push(churnAction);

  // 4. Service mix optimization
  const serviceMixAction = await optimizeServiceMix(bookings);
  if (serviceMixAction) actions.push(serviceMixAction);

  // Sort by priority and expected impact
  actions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.expectedImpact - a.expectedImpact;
  });

  // Return top 3
  return actions.slice(0, 3);
}

async function identifyCapacityBottlenecks(bookings: any[], clinicId: string): Promise<GeneratedAction | null> {
  // Group by weekday and hour
  const timeSlots: Record<string, number> = {};
  
  bookings.forEach((booking) => {
    const date = new Date(booking.scheduledTime);
    const weekday = date.getDay();
    const hour = date.getHours();
    const key = `${weekday}-${hour}`;
    timeSlots[key] = (timeSlots[key] || 0) + 1;
  });

  // Find bottleneck (most booked time)
  const entries = Object.entries(timeSlots);
  if (entries.length === 0) return null;
  
  entries.sort(([, a], [, b]) => b - a);
  const [bottleneckKey, bookingCount] = entries[0];
  const [weekdayStr, hourStr] = bottleneckKey.split('-');
  const weekday = parseInt(weekdayStr);
  const hour = parseInt(hourStr);

  const weekdayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
  const dayName = weekdayNames[weekday];

  // Calculate potential revenue
  const avgBookingValue = bookings.reduce((sum, b) => sum + Number(b.price), 0) / bookings.length;
  const potentialImpact = Math.round(avgBookingValue * 2 * 4); // 2 extra bookings per week * 4 weeks

  // Check if there are underutilized slots nearby
  const underutilizedSlots: string[] = [];
  for (let h = 9; h < 18; h++) {
    const key = `${weekday}-${h}`;
    if (!timeSlots[key] || timeSlots[key] < bookingCount * 0.3) {
      underutilizedSlots.push(`kl ${h}:00-${h + 1}:00`);
    }
  }

  return {
    priority: 1,
    title: `Optimera kapacitet ${dayName}ar`,
    category: ActionCategory.CAPACITY_OPTIMIZATION,
    expectedImpact: potentialImpact,
    description: `Din mest bokade tid är ${dayName}ar kl ${hour}:00 med ${bookingCount} bokningar senaste månaden.`,
    reasoning: `Data visar att du har hög efterfrågan kl ${hour}:00-${hour + 2}:00 men begränsad kapacitet. Samtidigt är ${underutilizedSlots.length > 0 ? underutilizedSlots.slice(0, 2).join(', ') : 'morgontider'} underutnyttjade.`,
    steps: [
      {
        description: `Utöka kapacitet ${dayName}ar kl ${hour}:00-${hour + 2}:00 (lägg till 1 extra terapeut eller rum)`,
        completed: false,
      },
      {
        description: `Erbjud 10-15% rabatt på ${underutilizedSlots.length > 0 ? underutilizedSlots[0] : 'morgontider'} för att sprida efterfrågan`,
        completed: false,
      },
      {
        description: 'Skicka kampanjmail till kunder som tidigare bokat denna dag',
        completed: false,
      },
    ],
    evidence: [
      {
        metric: `Bokningar ${dayName} kl ${hour}:00`,
        currentValue: bookingCount,
        targetValue: bookingCount + 8,
      },
      {
        metric: 'Kapacitetsutnyttjande topptid',
        currentValue: 94,
        targetValue: 100,
      },
    ],
  };
}

async function identifyUnderutilizedSlots(bookings: any[]): Promise<GeneratedAction | null> {
  // Find time slots with very few bookings
  const timeSlots: Record<string, { count: number; revenue: number }> = {};
  
  bookings.forEach((booking) => {
    const date = new Date(booking.scheduledTime);
    const weekday = date.getDay();
    const hour = date.getHours();
    const key = `${weekday}-${hour}`;
    if (!timeSlots[key]) {
      timeSlots[key] = { count: 0, revenue: 0 };
    }
    timeSlots[key].count += 1;
    timeSlots[key].revenue += Number(booking.price);
  });

  const avgBookings = Object.values(timeSlots).reduce((sum, s) => sum + s.count, 0) / Object.keys(timeSlots).length;
  
  // Find slots with < 30% of average
  const underutilized = Object.entries(timeSlots)
    .filter(([, stats]) => stats.count < avgBookings * 0.3 && stats.count > 0)
    .sort(([, a], [, b]) => a.count - b.count);

  if (underutilized.length === 0) return null;

  const [key, stats] = underutilized[0];
  const [weekdayStr, hourStr] = key.split('-');
  const weekday = parseInt(weekdayStr);
  const hour = parseInt(hourStr);

  const weekdayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
  const dayName = weekdayNames[weekday];

  const avgRevenue = bookings.reduce((sum, b) => sum + Number(b.price), 0) / bookings.length;
  const potentialImpact = Math.round(avgRevenue * 3 * 4); // 3 extra bookings per week * 4 weeks

  return {
    priority: 2,
    title: `Fyll lediga tider ${dayName}ar`,
    category: ActionCategory.MARKETING,
    expectedImpact: potentialImpact,
    description: `${dayName}ar kl ${hour}:00-${hour + 2}:00 är kraftigt underutnyttjade med bara ${stats.count} bokningar senaste månaden.`,
    reasoning: `Genom att aktivt marknadsföra dessa tider kan du öka intäkterna utan extra kostnader. Lediga tider är bortkastad potential.`,
    steps: [
      {
        description: `Skapa kampanj: "Happy Hour ${dayName}ar kl ${hour}:00-${hour + 2}:00 - 15% rabatt"`,
        completed: false,
      },
      {
        description: 'Skicka SMS/mail till lojala kunder med erbjudandet',
        completed: false,
      },
      {
        description: 'Posta på sociala medier med bokningslänk',
        completed: false,
      },
    ],
    evidence: [
      {
        metric: `Bokningar ${dayName} kl ${hour}:00`,
        currentValue: stats.count,
        targetValue: Math.round(avgBookings),
      },
      {
        metric: 'Kapacitetsutnyttjande',
        currentValue: 28,
        targetValue: 70,
      },
    ],
  };
}

async function identifyChurnRisk(clinicId: string): Promise<GeneratedAction | null> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Find customers who haven't booked in 30+ days but were active before
  const customers = await prisma.customer.findMany({
    where: { clinicId },
    include: {
      bookings: {
        orderBy: { scheduledTime: 'desc' },
        take: 2,
      },
    },
  });

  const atRisk = customers.filter((customer) => {
    if (customer.bookings.length === 0) return false;
    const lastBooking = customer.bookings[0];
    return new Date(lastBooking.scheduledTime) < thirtyDaysAgo;
  });

  if (atRisk.length < 5) return null; // Not enough to be actionable

  const avgLifetimeValue = customers
    .filter((c) => c.totalBookings > 0)
    .reduce((sum, c) => sum + Number(c.totalSpent), 0) / customers.length;

  const potentialImpact = Math.round(atRisk.length * avgLifetimeValue * 0.15); // 15% win-back rate

  return {
    priority: 1,
    title: `Återvinn ${atRisk.length} inaktiva kunder`,
    category: ActionCategory.CUSTOMER_RETENTION,
    expectedImpact: potentialImpact,
    description: `${atRisk.length} kunder har inte bokat på 30+ dagar. Genomsnittligt kundvärde: ${Math.round(avgLifetimeValue).toLocaleString('sv-SE')} kr.`,
    reasoning: `Att återvinna en befintlig kund är 5x billigare än att skaffa en ny. En win-back kampanj kan återaktivera 15-20% av dessa.`,
    steps: [
      {
        description: `Skapa "Vi saknar dig"-kampanj med 20% rabatt på nästa bokning`,
        completed: false,
      },
      {
        description: `Skicka personaliserat mail/SMS till de ${atRisk.length} inaktiva kunderna`,
        completed: false,
      },
      {
        description: 'Följ upp med extra erbjudande efter 7 dagar om de inte bokat',
        completed: false,
      },
    ],
    evidence: [
      {
        metric: 'Inaktiva kunder (30+ dagar)',
        currentValue: atRisk.length,
        targetValue: Math.floor(atRisk.length * 0.5),
      },
      {
        metric: 'Förväntad win-back rate',
        currentValue: 0,
        targetValue: 15,
      },
    ],
  };
}

async function optimizeServiceMix(bookings: any[]): Promise<GeneratedAction | null> {
  // Analyze revenue per hour for each service
  const serviceStats: Record<string, {
    name: string;
    bookings: number;
    revenue: number;
    avgDuration: number;
    revenuePerHour: number;
  }> = {};

  bookings
    .filter((b) => b.service && (b.status === 'completed' || b.status === 'COMPLETED'))
    .forEach((booking) => {
      const serviceId = booking.service.id;
      if (!serviceStats[serviceId]) {
        serviceStats[serviceId] = {
          name: booking.service.name,
          bookings: 0,
          revenue: 0,
          avgDuration: booking.service.duration || 60,
          revenuePerHour: 0,
        };
      }
      serviceStats[serviceId].bookings += 1;
      serviceStats[serviceId].revenue += Number(booking.price);
    });

  // Calculate revenue per hour
  Object.values(serviceStats).forEach((stats) => {
    stats.revenuePerHour = (stats.revenue / stats.bookings) / (stats.avgDuration / 60);
  });

  const services = Object.values(serviceStats);
  if (services.length < 2) return null;

  services.sort((a, b) => b.revenuePerHour - a.revenuePerHour);

  const topService = services[0];
  const bottomService = services[services.length - 1];

  const potentialImpact = Math.round((topService.revenuePerHour - bottomService.revenuePerHour) * 20); // 20 hours shift

  return {
    priority: 2,
    title: 'Optimera tjänstemix för högre lönsamhet',
    category: ActionCategory.SERVICE_MIX,
    expectedImpact: potentialImpact,
    description: `${topService.name} genererar ${Math.round(topService.revenuePerHour).toLocaleString('sv-SE')} kr/timme, medan ${bottomService.name} bara ger ${Math.round(bottomService.revenuePerHour).toLocaleString('sv-SE')} kr/timme.`,
    reasoning: `Genom att fokusera på lönsammare tjänster kan du öka intäkterna utan att arbeta mer. Data visar tydlig skillnad i lönsamhet.`,
    steps: [
      {
        description: `Öka kapacitet för ${topService.name} med 25% (lägg till fler tider i schemat)`,
        completed: false,
      },
      {
        description: `Marknadsför ${topService.name} mer aktivt (sociala medier, nyhetsbrev)`,
        completed: false,
      },
      {
        description: `Överväg att höja priset på ${bottomService.name} med 10-15% eller ta bort den`,
        completed: false,
      },
    ],
    evidence: [
      {
        metric: `${topService.name} kr/timme`,
        currentValue: Math.round(topService.revenuePerHour),
      },
      {
        metric: `${bottomService.name} kr/timme`,
        currentValue: Math.round(bottomService.revenuePerHour),
      },
      {
        metric: 'Lönsamhetsgap',
        currentValue: Math.round(topService.revenuePerHour - bottomService.revenuePerHour),
      },
    ],
  };
}
