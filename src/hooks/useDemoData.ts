import { useMemo } from 'react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { ClinicSettings } from '@/types/clinic';

// Demo data that mimics a successful beauty clinic
export const useDemoData = () => {
  const { isDemoMode, demoClinic } = useDemoMode();

  const demoSettings: ClinicSettings = useMemo(() => ({
    // Basic settings
    costPerHour: 1200,
    adminTimePercentage: 15,
    profitMarginPercentage: 35,
    
    // Capacity settings
    weeklyOperatingHours: 40,
    operatingDaysPerWeek: 5,
    currentActiveCustomers: 145,
    
    // Treatment settings
    averageTreatmentTimeHours: 1.33,
    treatmentCapacityPerWeek: 30,
    
    // Clip card settings
    clipCardPrice: 14990,
    clipCardNumberOfVisits: 7,
    
    // Conversion rates (optimistic demo numbers)
    inquiriesConversionRate: 0.25,  // 25%
    firstTimeConversionRate: 0.85,  // 85%
    rebookingConversionRate: 0.78,  // 78%
    
    // Optimal corridor settings
    optimalMinUtilization: 75,
    optimalMaxUtilization: 90,
    
    // Demo flags
    isDemo: true
  }), []);

  const demoMetrics = useMemo(() => ({
    monthlyRevenue: 187500,
    monthlyProfit: 65625,
    utilizationRate: 82,
    newCustomersThisMonth: 28,
    averageCustomerValue: 14990,
    retentionRate: 78,
    nextMonthProjection: 195200,
    
    // Weekly performance
    weeklyBookings: [
      { week: 'V40', bookings: 23, revenue: 34470 },
      { week: 'V41', bookings: 27, revenue: 40473 },
      { week: 'V42', bookings: 25, revenue: 37475 },
      { week: 'V43', bookings: 29, revenue: 43471 }
    ],
    
    // Hourly distribution (peak hours demo data)
    hourlyDistribution: Array.from({ length: 24 }, (_, hour) => {
      if (hour < 8 || hour > 18) return 0;
      if (hour >= 10 && hour <= 16) return Math.floor(Math.random() * 8) + 3;
      return Math.floor(Math.random() * 4) + 1;
    }),
    
    // Recent activities
    recentActivities: [
      { type: 'booking', message: 'Ny bokning: Maria Andersson - Ansiktsbehandling', time: '10 min sedan' },
      { type: 'completion', message: 'Behandling slutförd: Emma Johansson', time: '25 min sedan' },
      { type: 'inquiry', message: 'Ny förfrågan via webbformulär', time: '1 timme sedan' },
      { type: 'rebooking', message: 'Återbokning: Lisa Eriksson', time: '2 timmar sedan' }
    ],
    
    // Customer segments
    customerSegments: [
      { segment: 'Nya kunder', count: 28, percentage: 19 },
      { segment: 'Återkommande', count: 89, percentage: 61 },
      { segment: 'VIP-kunder', count: 28, percentage: 20 }
    ]
  }), []);

  const demoRecommendations = useMemo(() => ([
    {
      id: 'demo-rec-1',
      type: 'capacity_optimization',
      title: 'Öka kapacitet på torsdagar',
      description: 'Torsdagar har 95% beläggning. Överväg att lägga till en extra behandlare.',
      impact: 'Potentiellt +15% intäkter',
      priority: 'high',
      actionRequired: 'Schemaläggning'
    },
    {
      id: 'demo-rec-2', 
      type: 'marketing',
      title: 'Optimera marknadsföring för 30-40 års segment',
      description: 'Låg konvertering i denna åldersgrupp trots hög förfrågningsvolym.',
      impact: 'Förbättra konvertering med 12%',
      priority: 'medium',
      actionRequired: 'Marketing kampanj'
    },
    {
      id: 'demo-rec-3',
      type: 'retention',
      title: 'Automatisera uppföljning efter behandling',
      description: 'Kunder som får uppföljning inom 24h återbokar 23% oftare.',
      impact: 'Öka retention från 78% till 85%',
      priority: 'medium', 
      actionRequired: 'SMS automation'
    }
  ]), []);

  // Return original data if not in demo mode
  if (!isDemoMode) {
    return {
      isDemoMode: false,
      demoSettings: null,
      demoMetrics: null,
      demoRecommendations: null,
      demoClinic: null
    };
  }

  return {
    isDemoMode,
    demoSettings,
    demoMetrics,
    demoRecommendations,
    demoClinic
  };
};