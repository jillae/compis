-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLINIC_ADMIN', 'CLINIC_STAFF');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('INTERNAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('VACATION', 'SICK_LEAVE', 'PERSONAL', 'UNPAID', 'PARENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StaffEmploymentType" AS ENUM ('FULLTIME', 'PARTTIME', 'HOURLY', 'CONTRACTOR', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('REGULAR', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ON_CALL', 'EXTRA');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ActionCategory" AS ENUM ('CAPACITY_OPTIMIZATION', 'PRICING', 'MARKETING', 'SERVICE_MIX', 'CUSTOMER_RETENTION', 'STAFFING');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PricingStatus" AS ENUM ('PENDING', 'APPLIED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'SWISH', 'BANK_TRANSFER', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingAlertType" AS ENUM ('TRIAL_EXPIRING', 'TRIAL_EXPIRED', 'PAYMENT_FAILED', 'INVOICE_OVERDUE', 'USAGE_LIMIT', 'CARD_EXPIRING', 'SUBSCRIPTION_CANCELLED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TagSource" AS ENUM ('BOOKING_SYSTEM', 'XLS_IMPORT', 'AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "TTSProvider" AS ENUM ('OPENAI', 'ELEVENLABS');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'ANSWERED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoiceIntentType" AS ENUM ('BOOKING', 'REBOOKING', 'CANCELLATION', 'FAQ', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "VoiceTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "UnlayerPlan" AS ENUM ('FREE', 'LAUNCH', 'SCALE', 'OPTIMIZE');

-- CreateEnum
CREATE TYPE "UnlayerLicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "DynamicPricingAction" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "InsightPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('CRITICAL', 'AT_RISK', 'HEALTHY', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "EmailCampaignType" AS ENUM ('ONBOARDING', 'TRIAL_NURTURE', 'UPGRADE_PROMPT', 'RETENTION', 'WIN_BACK', 'ANNOUNCEMENT', 'EDUCATIONAL', 'PROMOTIONAL');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailTriggerType" AS ENUM ('MANUAL', 'SCHEDULED', 'USER_ACTION', 'TIME_BASED', 'BEHAVIORAL', 'LIFECYCLE');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('IMMEDIATE', 'SCHEDULED', 'RECURRING', 'TRIGGERED');

-- CreateEnum
CREATE TYPE "EmailSendStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED', 'FAILED');

-- CreateEnum
CREATE TYPE "DisplayMode" AS ENUM ('FULL', 'OPERATIONS', 'KIOSK', 'CAMPAIGNS');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('STABLE', 'BETA', 'LABS');

-- CreateEnum
CREATE TYPE "BankConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'ERROR');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "jobTitle" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "clinicId" TEXT,
    "onboardingStep" INTEGER DEFAULT 0,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "bokadirektId" TEXT,
    "bokadirektApiKey" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'BASIC',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bokadirektEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "corexEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dynamicPricingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dynamicPricingLastToggled" TIMESTAMP(3),
    "retentionAutopilotEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiActionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metaAccessToken" TEXT,
    "metaAdAccountId" TEXT,
    "metaPixelId" TEXT,
    "metaAppId" TEXT,
    "metaAppSecret" TEXT,
    "metaTargetCPL" DECIMAL(8,2),
    "metaTargetROAS" DECIMAL(5,2),
    "metaCapacityMin" INTEGER DEFAULT 75,
    "metaCapacityMax" INTEGER DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dynamicPricingMinPercent" INTEGER DEFAULT 10,
    "dynamicPricingMaxPercent" INTEGER DEFAULT 30,
    "ghlEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ghlApiKey" TEXT,
    "ghlLocationId" TEXT,
    "ghlLastSync" TIMESTAMP(3),
    "activeDisplayMode" "DisplayMode" NOT NULL DEFAULT 'FULL',
    "plaidEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "bokadirektId" TEXT,
    "clinicId" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dateOfBirth" TIMESTAMP(3),
    "city" TEXT,
    "postalCode" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "firstVisit" TIMESTAMP(3),
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'bokadirekt',
    "sourceId" TEXT,
    "importedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "customerStatusId" TEXT,
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consentSms" BOOLEAN NOT NULL DEFAULT false,
    "consentEmail" BOOLEAN NOT NULL DEFAULT false,
    "consentMarketing" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "canBookFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasResponsible" TEXT,
    "isResponsibleFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT,
    "profileImage" TEXT,
    "notes" TEXT,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "firstVisitAt" TIMESTAMP(3),
    "lastVisitAt" TIMESTAMP(3),
    "averageSpend" DECIMAL(10,2),
    "lifetimeValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "churnRisk" TEXT,
    "churnScore" DECIMAL(3,2),
    "predictedChurnDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "healthScore" INTEGER DEFAULT 50,
    "healthStatus" "HealthStatus" DEFAULT 'HEALTHY',
    "lastHealthCalculation" TIMESTAMP(3),
    "riskFactors" JSONB,
    "engagementScore" INTEGER DEFAULT 50,
    "monetaryScore" INTEGER DEFAULT 50,
    "frequencyScore" INTEGER DEFAULT 50,
    "deactivatedAt" TIMESTAMP(3),
    "deactivationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "bokadirektId" TEXT,
    "clinicId" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialization" TEXT,
    "clockifyUserId" TEXT,
    "clockifyWorkspaceId" TEXT,
    "employmentType" "StaffEmploymentType" NOT NULL DEFAULT 'FULLTIME',
    "hourlyRate" DECIMAL(8,2),
    "weeklyHours" INTEGER DEFAULT 40,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipmentType" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "bokadirektId" TEXT,
    "clinicId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bokadirektId" TEXT,
    "clinicId" TEXT,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT,
    "serviceId" TEXT,
    "roomId" TEXT,
    "treatmentType" TEXT NOT NULL DEFAULT '',
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "price" DECIMAL(8,2) NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "source" TEXT,
    "bookingChannel" TEXT,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BookingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isOnlineBooking" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "insightKey" TEXT NOT NULL,
    "insightDate" TIMESTAMP(3) NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "InsightDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClockifyIntegration" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "workspaceName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncErrors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClockifyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSchedule" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "clockifyTimeEntryId" TEXT,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 30,
    "shiftType" "ShiftType" NOT NULL DEFAULT 'REGULAR',
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTimeEntry" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "clockifyTimeEntryId" TEXT,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "totalMinutes" INTEGER,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "workMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffLeave" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "clockifyTimeOffId" TEXT,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyAction" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ActionCategory" NOT NULL,
    "expectedImpact" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "dismissReason" TEXT,
    "steps" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaCampaignMetric" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "metaCampaignId" TEXT NOT NULL,
    "metaCampaignName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "spend" DECIMAL(10,2) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "cpm" DECIMAL(10,2) NOT NULL,
    "cpc" DECIMAL(10,2) NOT NULL,
    "cpl" DECIMAL(10,2) NOT NULL,
    "ctr" DECIMAL(5,4) NOT NULL,
    "qualityRanking" TEXT,
    "conversionRanking" TEXT,
    "engagementRanking" TEXT,
    "qualityLeads" INTEGER NOT NULL DEFAULT 0,
    "showUpRate" DECIMAL(5,4),
    "revenue" DECIMAL(10,2) NOT NULL,
    "roas" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaCampaignMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRecommendation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "recommendedPrice" DECIMAL(10,2) NOT NULL,
    "reasoning" TEXT NOT NULL,
    "competitorData" JSONB,
    "demandData" JSONB NOT NULL,
    "expectedImpact" DECIMAL(10,2) NOT NULL,
    "status" "PricingStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "dismissReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPerformance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "utilization" DECIMAL(5,2) NOT NULL,
    "revenueGenerated" DECIMAL(10,2) NOT NULL,
    "totalBookings" INTEGER NOT NULL,
    "completedBookings" INTEGER NOT NULL,
    "noShowBookings" INTEGER NOT NULL,
    "avgTreatmentTime" INTEGER NOT NULL,
    "avgBookingValue" DECIMAL(10,2) NOT NULL,
    "customerRating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "totalStaff" INTEGER,
    "goalRevenue" DECIMAL(10,2),
    "goalProgress" DECIMAL(5,2),
    "bonusEarned" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerStatus" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "earnRule" JSONB NOT NULL,
    "redeemRule" JSONB NOT NULL,
    "tierRules" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "validDays" INTEGER[],
    "validHours" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "stampsExpireDays" INTEGER,
    "pointsExpireDays" INTEGER,
    "backgroundColor" TEXT,
    "logoUrl" TEXT,
    "welcomeSms" TEXT,
    "reminderSms" TEXT,
    "sendWelcomeSms" BOOLEAN NOT NULL DEFAULT false,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyCard" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "stamps" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'bronze',
    "expiresAt" TIMESTAMP(3),
    "lastEarnedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'sms',
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "segmentQuery" JSONB NOT NULL,
    "estimatedReach" INTEGER,
    "actualReach" INTEGER,
    "scheduleType" TEXT NOT NULL DEFAULT 'immediate',
    "scheduleAt" TIMESTAMP(3),
    "recurringRule" JSONB,
    "goal" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "optOutCount" INTEGER NOT NULL DEFAULT 0,
    "costSEK" DOUBLE PRECISION,
    "revenueSEK" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "aiVariants" JSONB,
    "clinicId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "customerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "to" TEXT NOT NULL,
    "from" TEXT,
    "providerId" TEXT,
    "providerName" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "costSEK" DOUBLE PRECISION,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredStamps" INTEGER,
    "requiredPoints" INTEGER,
    "valueSEK" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION,
    "freeProduct" TEXT,
    "freeService" TEXT,
    "expiresDays" INTEGER,
    "maxRedemptions" INTEGER,
    "totalAvailable" INTEGER,
    "totalRedeemed" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "campaignId" TEXT,
    "valueSEK" DOUBLE PRECISION NOT NULL,
    "verifiedBy" TEXT,
    "verificationCode" TEXT,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "meta" JSONB,
    "source" TEXT,
    "sourceId" TEXT,
    "valueSEK" DOUBLE PRECISION,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptOut" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "reason" TEXT,
    "optedOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalRows" INTEGER,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "errorLog" TEXT,
    "customersCreated" INTEGER NOT NULL DEFAULT 0,
    "customersUpdated" INTEGER NOT NULL DEFAULT 0,
    "customersSkipped" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT,
    "fromNumber" TEXT NOT NULL,
    "config" JSONB,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "messagesDelivered" INTEGER NOT NULL DEFAULT 0,
    "messagesFailed" INTEGER NOT NULL DEFAULT 0,
    "totalCostSEK" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rateLimitPerHour" INTEGER,
    "rateLimitPerDay" INTEGER,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "templateId" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalCost" DOUBLE PRECISION,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stamps" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "providerStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "cost" DOUBLE PRECISION,
    "parts" INTEGER NOT NULL DEFAULT 1,
    "customerId" TEXT,
    "campaignId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSRateLimit" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "maxPerHour" INTEGER NOT NULL DEFAULT 100,
    "maxPerDay" INTEGER NOT NULL DEFAULT 500,
    "maxPerMonth" INTEGER NOT NULL DEFAULT 10000,
    "sentThisHour" INTEGER NOT NULL DEFAULT 0,
    "sentToday" INTEGER NOT NULL DEFAULT 0,
    "sentThisMonth" INTEGER NOT NULL DEFAULT 0,
    "hourResetAt" TIMESTAMP(3) NOT NULL,
    "dayResetAt" TIMESTAMP(3) NOT NULL,
    "monthResetAt" TIMESTAMP(3) NOT NULL,
    "budgetSEK" DOUBLE PRECISION,
    "spentThisMonth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alertAt80Percent" BOOLEAN NOT NULL DEFAULT true,
    "alertAt100Percent" BOOLEAN NOT NULL DEFAULT true,
    "lastAlertSent" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCommunicationPreference" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "transactional" BOOLEAN NOT NULL DEFAULT true,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "loyalty" BOOLEAN NOT NULL DEFAULT false,
    "reminders" BOOLEAN NOT NULL DEFAULT true,
    "surveys" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "maxPerDay" INTEGER DEFAULT 3,
    "maxPerWeek" INTEGER DEFAULT 10,
    "consentGivenAt" TIMESTAMP(3),
    "consentMethod" TEXT,
    "consentIpAddress" TEXT,
    "consentUpdatedAt" TIMESTAMP(3),
    "optedOutAt" TIMESTAMP(3),
    "optOutMethod" TEXT,
    "optOutReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCommunicationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSTemplate" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVariant" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "variantName" TEXT,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "convertedCount" INTEGER NOT NULL DEFAULT 0,
    "optOutCount" INTEGER NOT NULL DEFAULT 0,
    "deliveryRate" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,
    "optOutRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "requiresConsent" BOOLEAN NOT NULL DEFAULT true,
    "consentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSStopKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'sv',
    "responseMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSStopKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isAutoTag" BOOLEAN NOT NULL DEFAULT false,
    "autoTagRule" JSONB,
    "customerCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTag" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "source" "TagSource" NOT NULL DEFAULT 'MANUAL',
    "sourceReference" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" TEXT,
    "autoTaggedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "customerCount" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "contentHtml" TEXT NOT NULL,
    "contentText" TEXT,
    "contentSms" TEXT,
    "sendChannels" TEXT[] DEFAULT ARRAY['email']::TEXT[],
    "segmentId" TEXT,
    "tagFilters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "isAbTest" BOOLEAN NOT NULL DEFAULT false,
    "variantName" TEXT,
    "parentId" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "unsubscribedCount" INTEGER NOT NULL DEFAULT 0,
    "deliveryRate" DOUBLE PRECISION,
    "openRate" DOUBLE PRECISION,
    "clickRate" DOUBLE PRECISION,
    "unsubscribeRate" DOUBLE PRECISION,
    "costSEK" DOUBLE PRECISION,
    "revenueSEK" DOUBLE PRECISION,
    "roiPercent" DOUBLE PRECISION,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT[] DEFAULT ARRAY['email']::TEXT[],
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unsubscribeReason" TEXT,
    "unsubscribeMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "bookingsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "bookingsLimit" INTEGER,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "stripeInvoiceId" TEXT,
    "hostedInvoiceUrl" TEXT,
    "invoicePdfUrl" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "lineItems" JSONB NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "status" "PaymentStatus" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "last4" TEXT,
    "brand" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "succeededAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingAlert" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" "BillingAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceConfiguration" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "primaryProvider" "TTSProvider" NOT NULL DEFAULT 'OPENAI',
    "openaiApiKey" TEXT,
    "openaiVoice" TEXT NOT NULL DEFAULT 'nova',
    "openaiModel" TEXT NOT NULL DEFAULT 'tts-1',
    "openaiSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "openaiFormat" TEXT NOT NULL DEFAULT 'mp3',
    "elevenlabsApiKey" TEXT,
    "elevenlabsVoiceId" TEXT,
    "elevenlabsSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "elevenlabsFormat" TEXT NOT NULL DEFAULT 'mp3_44100_128',
    "enableFallback" BOOLEAN NOT NULL DEFAULT true,
    "fallbackTimeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "phoneNumber" TEXT NOT NULL DEFAULT '+46766866273',
    "elksUsername" TEXT,
    "elksPassword" TEXT,
    "maxCallDurationMinutes" INTEGER NOT NULL DEFAULT 5,
    "enableBookingIntent" BOOLEAN NOT NULL DEFAULT true,
    "enableRebookingIntent" BOOLEAN NOT NULL DEFAULT true,
    "enableCancelIntent" BOOLEAN NOT NULL DEFAULT true,
    "enableFAQIntent" BOOLEAN NOT NULL DEFAULT false,
    "fallbackEmail" TEXT NOT NULL DEFAULT 'info@archacademy.se',
    "fallbackSubject" TEXT NOT NULL DEFAULT 'Tappat kundsamtal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceCall" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "direction" "CallDirection" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "transcript" TEXT,
    "detectedIntent" "VoiceIntentType",
    "intentConfidence" DOUBLE PRECISION,
    "ttsProviderUsed" "TTSProvider",
    "ttsFallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT,
    "bookingId" TEXT,
    "aiResponse" JSONB,
    "ticketId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceTicket" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "status" "VoiceTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'HIGH',
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "customerId" TEXT,
    "callId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "transcript" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "emailTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlayerLicense" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "plan" "UnlayerPlan" NOT NULL DEFAULT 'FREE',
    "status" "UnlayerLicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "apiKey" TEXT,
    "projectId" TEXT,
    "pricePerMonth" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsLimit" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnlayerLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicPricingLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "action" "DynamicPricingAction" NOT NULL,
    "toggledBy" TEXT,
    "toggledByName" TEXT,
    "daysSinceLastToggle" INTEGER,
    "toggledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "DynamicPricingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueInsight" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "period" "InsightPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "recurringRevenue" DECIMAL(12,2) NOT NULL,
    "newRevenue" DECIMAL(12,2) NOT NULL,
    "expansionRevenue" DECIMAL(12,2) NOT NULL,
    "churnedRevenue" DECIMAL(12,2) NOT NULL,
    "totalCustomers" INTEGER NOT NULL,
    "newCustomers" INTEGER NOT NULL,
    "activeCustomers" INTEGER NOT NULL,
    "churnedCustomers" INTEGER NOT NULL,
    "reactivatedCustomers" INTEGER NOT NULL,
    "totalBookings" INTEGER NOT NULL,
    "completedBookings" INTEGER NOT NULL,
    "cancelledBookings" INTEGER NOT NULL,
    "noShowBookings" INTEGER NOT NULL,
    "averageRevenuePerUser" DECIMAL(10,2) NOT NULL,
    "averageBookingValue" DECIMAL(10,2) NOT NULL,
    "customerLifetimeValue" DECIMAL(10,2),
    "churnRate" DECIMAL(5,4),
    "growthRate" DECIMAL(5,4),
    "utilizationRate" DECIMAL(5,2),
    "peakHours" JSONB,
    "slowHours" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EmailCampaignType" NOT NULL,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "fromName" TEXT NOT NULL DEFAULT 'Flow',
    "fromEmail" TEXT NOT NULL DEFAULT 'noreply@klinikflow.se',
    "replyTo" TEXT,
    "segmentRules" JSONB,
    "testGroup" BOOLEAN NOT NULL DEFAULT false,
    "triggerType" "EmailTriggerType" NOT NULL,
    "triggerConfig" JSONB,
    "scheduleType" "ScheduleType" NOT NULL DEFAULT 'IMMEDIATE',
    "scheduledAt" TIMESTAMP(3),
    "recurringRule" JSONB,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalUnsubscribed" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "openRate" DECIMAL(5,4),
    "clickRate" DECIMAL(5,4),
    "conversionRate" DECIMAL(5,4),
    "isAbTest" BOOLEAN NOT NULL DEFAULT false,
    "abTestConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "unlayerDesign" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSend" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "customerId" TEXT,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "providerId" TEXT,
    "providerStatus" TEXT,
    "status" "EmailSendStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorProfile" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "location" TEXT,
    "category" TEXT,
    "tier" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "googleMapsUrl" TEXT,
    "bokadirektUrl" TEXT,
    "overallRating" DECIMAL(3,2),
    "totalReviews" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMonitoring" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorPriceSnapshot" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceCategory" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER,
    "ourPrice" DECIMAL(10,2),
    "priceDiff" DECIMAL(10,2),
    "priceDiffPct" DECIMAL(5,2),
    "isPromotion" BOOLEAN NOT NULL DEFAULT false,
    "promotionDetails" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorexConversation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'web',
    "locale" TEXT NOT NULL DEFAULT 'sv-SE',
    "messages" JSONB NOT NULL,
    "summary" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentiment" TEXT,
    "preferences" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER,
    "satisfactionScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorexConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GHLIntegrationLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ghlId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GHLIntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "category" TEXT,
    "status" "ModuleStatus" NOT NULL DEFAULT 'STABLE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleAccess" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayModeConfig" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "displayMode" "DisplayMode" NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "isVisibleToStaff" BOOLEAN NOT NULL DEFAULT true,
    "isVisibleToAdmin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayModeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankConnection" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "status" "BankConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "accountIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cursor" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT DEFAULT 'pending',
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "bankConnectionId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "valueDate" TIMESTAMP(3) NOT NULL,
    "remittanceInformation" TEXT,
    "debtorName" TEXT,
    "creditorName" TEXT,
    "transactionType" TEXT,
    "proprietaryCode" TEXT,
    "category" TEXT,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledBookingId" TEXT,
    "aiConfidence" DECIMAL(5,4),
    "aiSuggestions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueIntelligence" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "bankRevenue" DECIMAL(12,2),
    "bokadirektRevenue" DECIMAL(12,2),
    "variance" DECIMAL(12,2),
    "cashflowIn" DECIMAL(12,2),
    "cashflowOut" DECIMAL(12,2),
    "netCashflow" DECIMAL(12,2),
    "predictedRevenue" DECIMAL(12,2),
    "predictedCashflow" DECIMAL(12,2),
    "predictionConfidence" DECIMAL(5,4),
    "topServices" JSONB,
    "insights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clinicId_idx" ON "User"("clinicId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_bokadirektId_key" ON "Clinic"("bokadirektId");

-- CreateIndex
CREATE INDEX "Clinic_bokadirektId_idx" ON "Clinic"("bokadirektId");

-- CreateIndex
CREATE INDEX "Clinic_name_idx" ON "Clinic"("name");

-- CreateIndex
CREATE INDEX "Clinic_tier_idx" ON "Clinic"("tier");

-- CreateIndex
CREATE INDEX "Clinic_subscriptionStatus_idx" ON "Clinic"("subscriptionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_bokadirektId_key" ON "Customer"("bokadirektId");

-- CreateIndex
CREATE INDEX "Customer_bokadirektId_idx" ON "Customer"("bokadirektId");

-- CreateIndex
CREATE INDEX "Customer_clinicId_idx" ON "Customer"("clinicId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_bokadirektId_key" ON "Staff"("bokadirektId");

-- CreateIndex
CREATE INDEX "Staff_bokadirektId_idx" ON "Staff"("bokadirektId");

-- CreateIndex
CREATE INDEX "Staff_clinicId_idx" ON "Staff"("clinicId");

-- CreateIndex
CREATE INDEX "Staff_userId_idx" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_name_idx" ON "Staff"("name");

-- CreateIndex
CREATE INDEX "Staff_specialization_idx" ON "Staff"("specialization");

-- CreateIndex
CREATE INDEX "Staff_clockifyUserId_idx" ON "Staff"("clockifyUserId");

-- CreateIndex
CREATE INDEX "Room_name_idx" ON "Room"("name");

-- CreateIndex
CREATE INDEX "Room_equipmentType_idx" ON "Room"("equipmentType");

-- CreateIndex
CREATE UNIQUE INDEX "Service_bokadirektId_key" ON "Service"("bokadirektId");

-- CreateIndex
CREATE INDEX "Service_bokadirektId_idx" ON "Service"("bokadirektId");

-- CreateIndex
CREATE INDEX "Service_clinicId_idx" ON "Service"("clinicId");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bokadirektId_key" ON "Booking"("bokadirektId");

-- CreateIndex
CREATE INDEX "Booking_bokadirektId_idx" ON "Booking"("bokadirektId");

-- CreateIndex
CREATE INDEX "Booking_clinicId_idx" ON "Booking"("clinicId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_staffId_idx" ON "Booking"("staffId");

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- CreateIndex
CREATE INDEX "Booking_roomId_idx" ON "Booking"("roomId");

-- CreateIndex
CREATE INDEX "Booking_scheduledTime_idx" ON "Booking"("scheduledTime");

-- CreateIndex
CREATE INDEX "Booking_startTime_idx" ON "Booking"("startTime");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_source_idx" ON "Booking"("source");

-- CreateIndex
CREATE INDEX "Booking_treatmentType_idx" ON "Booking"("treatmentType");

-- CreateIndex
CREATE INDEX "Booking_bookingChannel_idx" ON "Booking"("bookingChannel");

-- CreateIndex
CREATE INDEX "ImportLog_status_idx" ON "ImportLog"("status");

-- CreateIndex
CREATE INDEX "ImportLog_createdAt_idx" ON "ImportLog"("createdAt");

-- CreateIndex
CREATE INDEX "InsightDismissal_userId_idx" ON "InsightDismissal"("userId");

-- CreateIndex
CREATE INDEX "InsightDismissal_clinicId_idx" ON "InsightDismissal"("clinicId");

-- CreateIndex
CREATE INDEX "InsightDismissal_insightKey_idx" ON "InsightDismissal"("insightKey");

-- CreateIndex
CREATE UNIQUE INDEX "InsightDismissal_userId_clinicId_insightKey_insightDate_key" ON "InsightDismissal"("userId", "clinicId", "insightKey", "insightDate");

-- CreateIndex
CREATE UNIQUE INDEX "ClockifyIntegration_clinicId_key" ON "ClockifyIntegration"("clinicId");

-- CreateIndex
CREATE INDEX "ClockifyIntegration_clinicId_idx" ON "ClockifyIntegration"("clinicId");

-- CreateIndex
CREATE INDEX "ClockifyIntegration_workspaceId_idx" ON "ClockifyIntegration"("workspaceId");

-- CreateIndex
CREATE INDEX "StaffSchedule_clinicId_idx" ON "StaffSchedule"("clinicId");

-- CreateIndex
CREATE INDEX "StaffSchedule_staffId_idx" ON "StaffSchedule"("staffId");

-- CreateIndex
CREATE INDEX "StaffSchedule_shiftDate_idx" ON "StaffSchedule"("shiftDate");

-- CreateIndex
CREATE INDEX "StaffSchedule_status_idx" ON "StaffSchedule"("status");

-- CreateIndex
CREATE INDEX "StaffSchedule_clockifyTimeEntryId_idx" ON "StaffSchedule"("clockifyTimeEntryId");

-- CreateIndex
CREATE INDEX "StaffTimeEntry_clinicId_idx" ON "StaffTimeEntry"("clinicId");

-- CreateIndex
CREATE INDEX "StaffTimeEntry_staffId_idx" ON "StaffTimeEntry"("staffId");

-- CreateIndex
CREATE INDEX "StaffTimeEntry_clockInAt_idx" ON "StaffTimeEntry"("clockInAt");

-- CreateIndex
CREATE INDEX "StaffTimeEntry_clockifyTimeEntryId_idx" ON "StaffTimeEntry"("clockifyTimeEntryId");

-- CreateIndex
CREATE INDEX "StaffLeave_staffId_idx" ON "StaffLeave"("staffId");

-- CreateIndex
CREATE INDEX "StaffLeave_clinicId_idx" ON "StaffLeave"("clinicId");

-- CreateIndex
CREATE INDEX "StaffLeave_startDate_idx" ON "StaffLeave"("startDate");

-- CreateIndex
CREATE INDEX "StaffLeave_endDate_idx" ON "StaffLeave"("endDate");

-- CreateIndex
CREATE INDEX "StaffLeave_status_idx" ON "StaffLeave"("status");

-- CreateIndex
CREATE INDEX "StaffLeave_leaveType_idx" ON "StaffLeave"("leaveType");

-- CreateIndex
CREATE INDEX "WeeklyAction_clinicId_idx" ON "WeeklyAction"("clinicId");

-- CreateIndex
CREATE INDEX "WeeklyAction_weekStartDate_idx" ON "WeeklyAction"("weekStartDate");

-- CreateIndex
CREATE INDEX "WeeklyAction_priority_idx" ON "WeeklyAction"("priority");

-- CreateIndex
CREATE INDEX "WeeklyAction_status_idx" ON "WeeklyAction"("status");

-- CreateIndex
CREATE INDEX "WeeklyAction_category_idx" ON "WeeklyAction"("category");

-- CreateIndex
CREATE INDEX "MetaCampaignMetric_clinicId_idx" ON "MetaCampaignMetric"("clinicId");

-- CreateIndex
CREATE INDEX "MetaCampaignMetric_date_idx" ON "MetaCampaignMetric"("date");

-- CreateIndex
CREATE INDEX "MetaCampaignMetric_metaCampaignId_idx" ON "MetaCampaignMetric"("metaCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaCampaignMetric_clinicId_metaCampaignId_date_key" ON "MetaCampaignMetric"("clinicId", "metaCampaignId", "date");

-- CreateIndex
CREATE INDEX "PricingRecommendation_clinicId_idx" ON "PricingRecommendation"("clinicId");

-- CreateIndex
CREATE INDEX "PricingRecommendation_serviceId_idx" ON "PricingRecommendation"("serviceId");

-- CreateIndex
CREATE INDEX "PricingRecommendation_status_idx" ON "PricingRecommendation"("status");

-- CreateIndex
CREATE INDEX "PricingRecommendation_createdAt_idx" ON "PricingRecommendation"("createdAt");

-- CreateIndex
CREATE INDEX "StaffPerformance_staffId_idx" ON "StaffPerformance"("staffId");

-- CreateIndex
CREATE INDEX "StaffPerformance_clinicId_idx" ON "StaffPerformance"("clinicId");

-- CreateIndex
CREATE INDEX "StaffPerformance_weekStart_idx" ON "StaffPerformance"("weekStart");

-- CreateIndex
CREATE INDEX "StaffPerformance_utilization_idx" ON "StaffPerformance"("utilization");

-- CreateIndex
CREATE INDEX "StaffPerformance_revenueGenerated_idx" ON "StaffPerformance"("revenueGenerated");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPerformance_staffId_weekStart_key" ON "StaffPerformance"("staffId", "weekStart");

-- CreateIndex
CREATE INDEX "CustomerStatus_clinicId_idx" ON "CustomerStatus"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerStatus_clinicId_sourceId_key" ON "CustomerStatus"("clinicId", "sourceId");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_clinicId_idx" ON "LoyaltyProgram"("clinicId");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_isActive_idx" ON "LoyaltyProgram"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_clinicId_code_key" ON "LoyaltyProgram"("clinicId", "code");

-- CreateIndex
CREATE INDEX "LoyaltyCard_customerId_idx" ON "LoyaltyCard"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyCard_programId_idx" ON "LoyaltyCard"("programId");

-- CreateIndex
CREATE INDEX "LoyaltyCard_isActive_idx" ON "LoyaltyCard"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCard_customerId_programId_key" ON "LoyaltyCard"("customerId", "programId");

-- CreateIndex
CREATE INDEX "Campaign_clinicId_idx" ON "Campaign"("clinicId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_scheduleAt_idx" ON "Campaign"("scheduleAt");

-- CreateIndex
CREATE INDEX "Campaign_channel_idx" ON "Campaign"("channel");

-- CreateIndex
CREATE INDEX "Message_clinicId_idx" ON "Message"("clinicId");

-- CreateIndex
CREATE INDEX "Message_campaignId_idx" ON "Message"("campaignId");

-- CreateIndex
CREATE INDEX "Message_customerId_idx" ON "Message"("customerId");

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- CreateIndex
CREATE INDEX "Message_sentAt_idx" ON "Message"("sentAt");

-- CreateIndex
CREATE INDEX "Reward_programId_idx" ON "Reward"("programId");

-- CreateIndex
CREATE INDEX "Reward_isActive_idx" ON "Reward"("isActive");

-- CreateIndex
CREATE INDEX "Redemption_clinicId_idx" ON "Redemption"("clinicId");

-- CreateIndex
CREATE INDEX "Redemption_customerId_idx" ON "Redemption"("customerId");

-- CreateIndex
CREATE INDEX "Redemption_rewardId_idx" ON "Redemption"("rewardId");

-- CreateIndex
CREATE INDEX "Redemption_status_idx" ON "Redemption"("status");

-- CreateIndex
CREATE INDEX "Event_clinicId_idx" ON "Event"("clinicId");

-- CreateIndex
CREATE INDEX "Event_customerId_idx" ON "Event"("customerId");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_occurredAt_idx" ON "Event"("occurredAt");

-- CreateIndex
CREATE INDEX "OptOut_clinicId_idx" ON "OptOut"("clinicId");

-- CreateIndex
CREATE INDEX "OptOut_customerId_idx" ON "OptOut"("customerId");

-- CreateIndex
CREATE INDEX "OptOut_channel_idx" ON "OptOut"("channel");

-- CreateIndex
CREATE INDEX "ImportJob_clinicId_idx" ON "ImportJob"("clinicId");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_source_idx" ON "ImportJob"("source");

-- CreateIndex
CREATE INDEX "SMSProviderConfig_clinicId_idx" ON "SMSProviderConfig"("clinicId");

-- CreateIndex
CREATE INDEX "SMSProviderConfig_provider_idx" ON "SMSProviderConfig"("provider");

-- CreateIndex
CREATE INDEX "SMSProviderConfig_isPrimary_idx" ON "SMSProviderConfig"("isPrimary");

-- CreateIndex
CREATE INDEX "SMSCampaign_clinicId_idx" ON "SMSCampaign"("clinicId");

-- CreateIndex
CREATE INDEX "SMSCampaign_sentAt_idx" ON "SMSCampaign"("sentAt");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_customerId_idx" ON "LoyaltyTransaction"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_clinicId_idx" ON "LoyaltyTransaction"("clinicId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_type_idx" ON "LoyaltyTransaction"("type");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_createdAt_idx" ON "LoyaltyTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "SMSLog_clinicId_idx" ON "SMSLog"("clinicId");

-- CreateIndex
CREATE INDEX "SMSLog_customerId_idx" ON "SMSLog"("customerId");

-- CreateIndex
CREATE INDEX "SMSLog_campaignId_idx" ON "SMSLog"("campaignId");

-- CreateIndex
CREATE INDEX "SMSLog_status_idx" ON "SMSLog"("status");

-- CreateIndex
CREATE INDEX "SMSLog_direction_idx" ON "SMSLog"("direction");

-- CreateIndex
CREATE INDEX "SMSLog_providerId_idx" ON "SMSLog"("providerId");

-- CreateIndex
CREATE INDEX "SMSLog_createdAt_idx" ON "SMSLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SMSRateLimit_clinicId_key" ON "SMSRateLimit"("clinicId");

-- CreateIndex
CREATE INDEX "SMSRateLimit_clinicId_idx" ON "SMSRateLimit"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCommunicationPreference_customerId_key" ON "CustomerCommunicationPreference"("customerId");

-- CreateIndex
CREATE INDEX "CustomerCommunicationPreference_customerId_idx" ON "CustomerCommunicationPreference"("customerId");

-- CreateIndex
CREATE INDEX "CustomerCommunicationPreference_smsEnabled_idx" ON "CustomerCommunicationPreference"("smsEnabled");

-- CreateIndex
CREATE INDEX "CustomerCommunicationPreference_marketing_idx" ON "CustomerCommunicationPreference"("marketing");

-- CreateIndex
CREATE INDEX "SMSTemplate_clinicId_idx" ON "SMSTemplate"("clinicId");

-- CreateIndex
CREATE INDEX "SMSTemplate_category_idx" ON "SMSTemplate"("category");

-- CreateIndex
CREATE INDEX "SMSTemplate_isActive_idx" ON "SMSTemplate"("isActive");

-- CreateIndex
CREATE INDEX "SMSTemplate_isVariant_idx" ON "SMSTemplate"("isVariant");

-- CreateIndex
CREATE UNIQUE INDEX "SMSStopKeyword_keyword_key" ON "SMSStopKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SMSStopKeyword_keyword_idx" ON "SMSStopKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SMSStopKeyword_isActive_idx" ON "SMSStopKeyword"("isActive");

-- CreateIndex
CREATE INDEX "Tag_clinicId_idx" ON "Tag"("clinicId");

-- CreateIndex
CREATE INDEX "Tag_isActive_idx" ON "Tag"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_clinicId_name_key" ON "Tag"("clinicId", "name");

-- CreateIndex
CREATE INDEX "CustomerTag_customerId_idx" ON "CustomerTag"("customerId");

-- CreateIndex
CREATE INDEX "CustomerTag_tagId_idx" ON "CustomerTag"("tagId");

-- CreateIndex
CREATE INDEX "CustomerTag_source_idx" ON "CustomerTag"("source");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_customerId_tagId_key" ON "CustomerTag"("customerId", "tagId");

-- CreateIndex
CREATE INDEX "CustomerSegment_clinicId_idx" ON "CustomerSegment"("clinicId");

-- CreateIndex
CREATE INDEX "CustomerSegment_isActive_idx" ON "CustomerSegment"("isActive");

-- CreateIndex
CREATE INDEX "Newsletter_clinicId_idx" ON "Newsletter"("clinicId");

-- CreateIndex
CREATE INDEX "Newsletter_status_idx" ON "Newsletter"("status");

-- CreateIndex
CREATE INDEX "Newsletter_segmentId_idx" ON "Newsletter"("segmentId");

-- CreateIndex
CREATE INDEX "Newsletter_scheduledAt_idx" ON "Newsletter"("scheduledAt");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_clinicId_idx" ON "NewsletterSubscriber"("clinicId");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_customerId_idx" ON "NewsletterSubscriber"("customerId");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_isActive_idx" ON "NewsletterSubscriber"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_clinicId_customerId_key" ON "NewsletterSubscriber"("clinicId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_clinicId_key" ON "Subscription"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_clinicId_idx" ON "Subscription"("clinicId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_clinicId_idx" ON "Invoice"("clinicId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");

-- CreateIndex
CREATE INDEX "Payment_clinicId_idx" ON "Payment"("clinicId");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "BillingAlert_clinicId_idx" ON "BillingAlert"("clinicId");

-- CreateIndex
CREATE INDEX "BillingAlert_subscriptionId_idx" ON "BillingAlert"("subscriptionId");

-- CreateIndex
CREATE INDEX "BillingAlert_resolved_idx" ON "BillingAlert"("resolved");

-- CreateIndex
CREATE INDEX "BillingAlert_type_idx" ON "BillingAlert"("type");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceConfiguration_clinicId_key" ON "VoiceConfiguration"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceCall_callId_key" ON "VoiceCall"("callId");

-- CreateIndex
CREATE INDEX "VoiceCall_clinicId_idx" ON "VoiceCall"("clinicId");

-- CreateIndex
CREATE INDEX "VoiceCall_callId_idx" ON "VoiceCall"("callId");

-- CreateIndex
CREATE INDEX "VoiceCall_status_idx" ON "VoiceCall"("status");

-- CreateIndex
CREATE INDEX "VoiceCall_detectedIntent_idx" ON "VoiceCall"("detectedIntent");

-- CreateIndex
CREATE INDEX "VoiceCall_customerId_idx" ON "VoiceCall"("customerId");

-- CreateIndex
CREATE INDEX "VoiceCall_bookingId_idx" ON "VoiceCall"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceTicket_ticketNumber_key" ON "VoiceTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "VoiceTicket_clinicId_idx" ON "VoiceTicket"("clinicId");

-- CreateIndex
CREATE INDEX "VoiceTicket_ticketNumber_idx" ON "VoiceTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "VoiceTicket_status_idx" ON "VoiceTicket"("status");

-- CreateIndex
CREATE INDEX "VoiceTicket_customerId_idx" ON "VoiceTicket"("customerId");

-- CreateIndex
CREATE INDEX "VoiceTicket_resolved_idx" ON "VoiceTicket"("resolved");

-- CreateIndex
CREATE UNIQUE INDEX "UnlayerLicense_clinicId_key" ON "UnlayerLicense"("clinicId");

-- CreateIndex
CREATE INDEX "UnlayerLicense_clinicId_idx" ON "UnlayerLicense"("clinicId");

-- CreateIndex
CREATE INDEX "UnlayerLicense_status_idx" ON "UnlayerLicense"("status");

-- CreateIndex
CREATE INDEX "UnlayerLicense_plan_idx" ON "UnlayerLicense"("plan");

-- CreateIndex
CREATE INDEX "UnlayerLicense_expiresAt_idx" ON "UnlayerLicense"("expiresAt");

-- CreateIndex
CREATE INDEX "DynamicPricingLog_clinicId_idx" ON "DynamicPricingLog"("clinicId");

-- CreateIndex
CREATE INDEX "DynamicPricingLog_toggledAt_idx" ON "DynamicPricingLog"("toggledAt");

-- CreateIndex
CREATE INDEX "DynamicPricingLog_action_idx" ON "DynamicPricingLog"("action");

-- CreateIndex
CREATE INDEX "RevenueInsight_clinicId_idx" ON "RevenueInsight"("clinicId");

-- CreateIndex
CREATE INDEX "RevenueInsight_period_idx" ON "RevenueInsight"("period");

-- CreateIndex
CREATE INDEX "RevenueInsight_startDate_idx" ON "RevenueInsight"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueInsight_clinicId_period_startDate_key" ON "RevenueInsight"("clinicId", "period", "startDate");

-- CreateIndex
CREATE INDEX "EmailCampaign_clinicId_idx" ON "EmailCampaign"("clinicId");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_idx" ON "EmailCampaign"("status");

-- CreateIndex
CREATE INDEX "EmailCampaign_type_idx" ON "EmailCampaign"("type");

-- CreateIndex
CREATE INDEX "EmailCampaign_triggerType_idx" ON "EmailCampaign"("triggerType");

-- CreateIndex
CREATE INDEX "EmailTemplate_clinicId_idx" ON "EmailTemplate"("clinicId");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailSend_campaignId_idx" ON "EmailSend"("campaignId");

-- CreateIndex
CREATE INDEX "EmailSend_recipientEmail_idx" ON "EmailSend"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailSend_customerId_idx" ON "EmailSend"("customerId");

-- CreateIndex
CREATE INDEX "EmailSend_status_idx" ON "EmailSend"("status");

-- CreateIndex
CREATE INDEX "EmailSend_sentAt_idx" ON "EmailSend"("sentAt");

-- CreateIndex
CREATE INDEX "CompetitorProfile_clinicId_idx" ON "CompetitorProfile"("clinicId");

-- CreateIndex
CREATE INDEX "CompetitorProfile_isActive_idx" ON "CompetitorProfile"("isActive");

-- CreateIndex
CREATE INDEX "CompetitorProfile_isMonitoring_idx" ON "CompetitorProfile"("isMonitoring");

-- CreateIndex
CREATE INDEX "CompetitorPriceSnapshot_competitorId_idx" ON "CompetitorPriceSnapshot"("competitorId");

-- CreateIndex
CREATE INDEX "CompetitorPriceSnapshot_snapshotDate_idx" ON "CompetitorPriceSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "CompetitorPriceSnapshot_serviceName_idx" ON "CompetitorPriceSnapshot"("serviceName");

-- CreateIndex
CREATE INDEX "CorexConversation_clinicId_idx" ON "CorexConversation"("clinicId");

-- CreateIndex
CREATE INDEX "CorexConversation_sessionId_idx" ON "CorexConversation"("sessionId");

-- CreateIndex
CREATE INDEX "CorexConversation_userId_idx" ON "CorexConversation"("userId");

-- CreateIndex
CREATE INDEX "CorexConversation_isActive_idx" ON "CorexConversation"("isActive");

-- CreateIndex
CREATE INDEX "CorexConversation_lastInteraction_idx" ON "CorexConversation"("lastInteraction");

-- CreateIndex
CREATE INDEX "GHLIntegrationLog_clinicId_idx" ON "GHLIntegrationLog"("clinicId");

-- CreateIndex
CREATE INDEX "GHLIntegrationLog_status_idx" ON "GHLIntegrationLog"("status");

-- CreateIndex
CREATE INDEX "GHLIntegrationLog_entityType_idx" ON "GHLIntegrationLog"("entityType");

-- CreateIndex
CREATE INDEX "GHLIntegrationLog_entityId_idx" ON "GHLIntegrationLog"("entityId");

-- CreateIndex
CREATE INDEX "GHLIntegrationLog_createdAt_idx" ON "GHLIntegrationLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Module_key_key" ON "Module"("key");

-- CreateIndex
CREATE INDEX "Module_status_idx" ON "Module"("status");

-- CreateIndex
CREATE INDEX "Module_category_idx" ON "Module"("category");

-- CreateIndex
CREATE INDEX "ModuleAccess_tier_idx" ON "ModuleAccess"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleAccess_moduleId_tier_key" ON "ModuleAccess"("moduleId", "tier");

-- CreateIndex
CREATE INDEX "DisplayModeConfig_clinicId_idx" ON "DisplayModeConfig"("clinicId");

-- CreateIndex
CREATE INDEX "DisplayModeConfig_displayMode_idx" ON "DisplayModeConfig"("displayMode");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayModeConfig_clinicId_displayMode_moduleKey_key" ON "DisplayModeConfig"("clinicId", "displayMode", "moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "BankConnection_itemId_key" ON "BankConnection"("itemId");

-- CreateIndex
CREATE INDEX "BankConnection_clinicId_idx" ON "BankConnection"("clinicId");

-- CreateIndex
CREATE INDEX "BankConnection_status_idx" ON "BankConnection"("status");

-- CreateIndex
CREATE INDEX "BankConnection_itemId_idx" ON "BankConnection"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_transactionId_key" ON "BankTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "BankTransaction_bankConnectionId_idx" ON "BankTransaction"("bankConnectionId");

-- CreateIndex
CREATE INDEX "BankTransaction_clinicId_idx" ON "BankTransaction"("clinicId");

-- CreateIndex
CREATE INDEX "BankTransaction_bookingDate_idx" ON "BankTransaction"("bookingDate");

-- CreateIndex
CREATE INDEX "BankTransaction_category_idx" ON "BankTransaction"("category");

-- CreateIndex
CREATE INDEX "BankTransaction_isReconciled_idx" ON "BankTransaction"("isReconciled");

-- CreateIndex
CREATE INDEX "RevenueIntelligence_clinicId_idx" ON "RevenueIntelligence"("clinicId");

-- CreateIndex
CREATE INDEX "RevenueIntelligence_periodStart_idx" ON "RevenueIntelligence"("periodStart");

-- CreateIndex
CREATE INDEX "RevenueIntelligence_periodEnd_idx" ON "RevenueIntelligence"("periodEnd");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_customerStatusId_fkey" FOREIGN KEY ("customerStatusId") REFERENCES "CustomerStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClockifyIntegration" ADD CONSTRAINT "ClockifyIntegration_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSchedule" ADD CONSTRAINT "StaffSchedule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTimeEntry" ADD CONSTRAINT "StaffTimeEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLeave" ADD CONSTRAINT "StaffLeave_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRecommendation" ADD CONSTRAINT "PricingRecommendation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRecommendation" ADD CONSTRAINT "PricingRecommendation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPerformance" ADD CONSTRAINT "StaffPerformance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPerformance" ADD CONSTRAINT "StaffPerformance_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerStatus" ADD CONSTRAINT "CustomerStatus_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCard" ADD CONSTRAINT "LoyaltyCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCard" ADD CONSTRAINT "LoyaltyCard_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptOut" ADD CONSTRAINT "OptOut_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptOut" ADD CONSTRAINT "OptOut_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSProviderConfig" ADD CONSTRAINT "SMSProviderConfig_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSCampaign" ADD CONSTRAINT "SMSCampaign_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSLog" ADD CONSTRAINT "SMSLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSLog" ADD CONSTRAINT "SMSLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSLog" ADD CONSTRAINT "SMSLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSRateLimit" ADD CONSTRAINT "SMSRateLimit_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCommunicationPreference" ADD CONSTRAINT "CustomerCommunicationPreference_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSTemplate" ADD CONSTRAINT "SMSTemplate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSegment" ADD CONSTRAINT "CustomerSegment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Newsletter" ADD CONSTRAINT "Newsletter_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Newsletter" ADD CONSTRAINT "Newsletter_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "CustomerSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingAlert" ADD CONSTRAINT "BillingAlert_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingAlert" ADD CONSTRAINT "BillingAlert_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceConfiguration" ADD CONSTRAINT "VoiceConfiguration_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceCall" ADD CONSTRAINT "VoiceCall_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceCall" ADD CONSTRAINT "VoiceCall_configId_fkey" FOREIGN KEY ("configId") REFERENCES "VoiceConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceCall" ADD CONSTRAINT "VoiceCall_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceCall" ADD CONSTRAINT "VoiceCall_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceCall" ADD CONSTRAINT "VoiceCall_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "VoiceTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceTicket" ADD CONSTRAINT "VoiceTicket_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceTicket" ADD CONSTRAINT "VoiceTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlayerLicense" ADD CONSTRAINT "UnlayerLicense_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPricingLog" ADD CONSTRAINT "DynamicPricingLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueInsight" ADD CONSTRAINT "RevenueInsight_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSend" ADD CONSTRAINT "EmailSend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorProfile" ADD CONSTRAINT "CompetitorProfile_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorPriceSnapshot" ADD CONSTRAINT "CompetitorPriceSnapshot_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "CompetitorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorexConversation" ADD CONSTRAINT "CorexConversation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAccess" ADD CONSTRAINT "ModuleAccess_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayModeConfig" ADD CONSTRAINT "DisplayModeConfig_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
