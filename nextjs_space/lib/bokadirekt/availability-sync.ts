
/**
 * Bokadirekt Availability → StaffSchedule → Clockify Sync
 * 
 * Synkar personalens öppettider från Bokadirekt till Flow StaffSchedule
 * och vidare till Clockify om integration är aktiv.
 */

import { prisma } from '../db';
import { bokadirektClient } from './client';
import ClockifyClient from '../integrations/clockify-client';
import type { BokadirektAvailability } from './availability-types';
import type { SyncResult, SyncOptions } from './types';

/**
 * Konvertera BD availability till ISO datetime
 */
function parseAvailabilityDateTime(date: string, time: string): Date {
  // BD date: YYYY-MM-DD
  // BD time: either HH:MM:SS or full ISO
  
  if (time.includes('T')) {
    // Full ISO timestamp
    return new Date(time);
  }
  
  // Combine date + time
  return new Date(`${date}T${time}Z`);
}

/**
 * Synka BD availabilities → StaffSchedule
 */
export async function syncStaffAvailabilities(
  clinicId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    console.log('[AvailabilitySync] Starting staff availability sync for clinic:', clinicId);
    
    // Kolla om kliniken har BD-integration aktiverad
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        bokadirektEnabled: true,
        bokadirektApiKey: true,
      },
    });
    
    if (!clinic?.bokadirektEnabled || !clinic.bokadirektApiKey) {
      return {
        success: false,
        recordsFetched: 0,
        recordsUpserted: 0,
        errors: ['Bokadirekt integration not enabled for this clinic'],
        duration: Date.now() - startTime,
      };
    }
    
    // Skapa BD client med klinikens API-nyckel
    const bdClient = new (bokadirektClient.constructor as any)(clinic.bokadirektApiKey);
    
    // Hämta resources från BD med availabilities
    const resources = await bdClient.getResources(options);
    console.log(`[AvailabilitySync] Fetched ${resources.length} resources from BD`);
    
    let totalSchedulesCreated = 0;
    let totalAvailabilitiesParsed = 0;
    
    // För varje resource (staff member)
    for (const resource of resources) {
      try {
        // Hitta motsvarande staff i vår DB
        const staff = await prisma.staff.findFirst({
          where: {
            id: resource.resourceId,
            clinicId,
          },
        });
        
        if (!staff) {
          console.warn(`[AvailabilitySync] Staff not found for resource: ${resource.resourceId}`);
          continue;
        }
        
        // Parsea availabilities
        const availabilities = resource.availabilities || [];
        totalAvailabilitiesParsed += availabilities.length;
        
        console.log(`[AvailabilitySync] Processing ${availabilities.length} availabilities for staff: ${staff.name}`);
        
        for (const availability of availabilities) {
          try {
            const startTime = parseAvailabilityDateTime(availability.date, availability.startTime);
            const endTime = parseAvailabilityDateTime(availability.date, availability.endTime);
            
            // Kolla om schemat redan finns
            const existingSchedule = await prisma.staffSchedule.findFirst({
              where: {
                staffId: staff.id,
                clinicId,
                shiftDate: availability.date,
                startTime,
              },
            });
            
            if (existingSchedule) {
              // Uppdatera befintligt schema
              await prisma.staffSchedule.update({
                where: { id: existingSchedule.id },
                data: {
                  endTime,
                  breakMinutes: availability.breakMinutes || 0,
                  status: 'SCHEDULED',
                },
              });
            } else {
              // Skapa nytt schema
              // Note: createdBy will be set to a system user ID
              const systemUser = await prisma.user.findFirst({
                where: { role: 'SUPER_ADMIN' },
                select: { id: true },
              });
              
              await prisma.staffSchedule.create({
                data: {
                  clinicId,
                  staffId: staff.id,
                  shiftDate: new Date(availability.date),
                  startTime,
                  endTime,
                  breakMinutes: availability.breakMinutes || 0,
                  shiftType: 'REGULAR',
                  status: 'SCHEDULED',
                  notes: `Synced from Bokadirekt on ${new Date().toISOString()}`,
                  createdBy: systemUser?.id || 'system',
                },
              });
              totalSchedulesCreated++;
            }
          } catch (error) {
            const errorMsg = `Failed to process availability for ${staff.name} on ${availability.date}: ${error}`;
            console.error(`[AvailabilitySync] ${errorMsg}`);
            errors.push(errorMsg);
          }
        }
        
        // Synka till Clockify om integration är aktiv
        await syncStaffScheduleToClockify(clinicId, staff.id);
        
      } catch (error) {
        const errorMsg = `Failed to process resource ${resource.resourceId}: ${error}`;
        console.error(`[AvailabilitySync] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AvailabilitySync] Sync completed in ${duration}ms`);
    console.log(`[AvailabilitySync] Parsed ${totalAvailabilitiesParsed} availabilities`);
    console.log(`[AvailabilitySync] Created/Updated ${totalSchedulesCreated} schedules`);
    
    return {
      success: errors.length === 0,
      recordsFetched: totalAvailabilitiesParsed,
      recordsUpserted: totalSchedulesCreated,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Staff availability sync failed: ${error}`;
    console.error(`[AvailabilitySync] ${errorMsg}`);
    
    return {
      success: false,
      recordsFetched: 0,
      recordsUpserted: 0,
      errors: [errorMsg],
      duration,
    };
  }
}

/**
 * Synka StaffSchedule → Clockify
 */
async function syncStaffScheduleToClockify(
  clinicId: string,
  staffId: string
): Promise<void> {
  try {
    // Kolla om Clockify-integration är aktiv
    const clockifyIntegration = await prisma.clockifyIntegration.findUnique({
      where: { clinicId },
    });
    
    if (!clockifyIntegration || !clockifyIntegration.isActive) {
      console.log(`[ClockifySync] Clockify not enabled for clinic ${clinicId}, skipping sync`);
      return;
    }
    
    // Hämta staff med Clockify user ID
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        clockifyUserId: true,
        clockifyWorkspaceId: true,
        name: true,
      },
    });
    
    if (!staff?.clockifyUserId || !staff.clockifyWorkspaceId) {
      console.log(`[ClockifySync] Staff ${staffId} not connected to Clockify, skipping sync`);
      return;
    }
    
    // Hämta scheman för staff som inte är synkade till Clockify
    const schedules = await prisma.staffSchedule.findMany({
      where: {
        clinicId,
        staffId,
        clockifyTimeEntryId: null, // Inte synkad än
        status: 'SCHEDULED',
        shiftDate: {
          gte: new Date().toISOString().split('T')[0], // Från idag och framåt
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    if (schedules.length === 0) {
      console.log(`[ClockifySync] No unsynced schedules found for staff ${staff.name}`);
      return;
    }
    
    console.log(`[ClockifySync] Syncing ${schedules.length} schedules to Clockify for ${staff.name}`);
    
    // Skapa Clockify-klient
    const clockifyClient = new ClockifyClient(clockifyIntegration.apiKey);
    
    // Synka varje schema
    for (const schedule of schedules) {
      try {
        // Skapa time entry i Clockify
        const timeEntry = await clockifyClient.createTimeEntry(staff.clockifyWorkspaceId, {
          start: schedule.startTime.toISOString(),
          end: schedule.endTime.toISOString(),
          description: `Scheduled shift: ${schedule.shiftType}`,
          billable: false,
        });
        
        // Uppdatera schema med Clockify time entry ID
        await prisma.staffSchedule.update({
          where: { id: schedule.id },
          data: {
            clockifyTimeEntryId: timeEntry.id,
          },
        });
        
        console.log(`[ClockifySync] Successfully synced schedule ${schedule.id} to Clockify`);
      } catch (error) {
        console.error(`[ClockifySync] Failed to sync schedule ${schedule.id}:`, error);
        // Don't throw - continue with other schedules
      }
    }
  } catch (error) {
    console.error(`[ClockifySync] Failed to sync to Clockify:`, error);
    // Don't throw - Clockify sync is non-critical
  }
}

/**
 * Full sync: BD availabilities → StaffSchedule → Clockify
 */
export async function syncAllStaffAvailabilities(
  options: SyncOptions = {}
): Promise<{
  clinics: Array<{
    clinicId: string;
    clinicName: string;
    result: SyncResult;
  }>;
  overall: {
    success: boolean;
    totalDuration: number;
    errors: string[];
  };
}> {
  const overallStart = Date.now();
  const allErrors: string[] = [];
  const clinicResults: Array<{
    clinicId: string;
    clinicName: string;
    result: SyncResult;
  }> = [];
  
  try {
    // Hämta alla kliniker med BD-integration aktiverad
    const clinics = await prisma.clinic.findMany({
      where: {
        bokadirektEnabled: true,
        bokadirektApiKey: { not: null },
      },
      select: {
        id: true,
        name: true,
      },
    });
    
    console.log(`[AvailabilitySync] Found ${clinics.length} clinics with BD integration`);
    
    // Synka varje klinik
    for (const clinic of clinics) {
      const result = await syncStaffAvailabilities(clinic.id, options);
      clinicResults.push({
        clinicId: clinic.id,
        clinicName: clinic.name,
        result,
      });
      allErrors.push(...result.errors);
    }
    
    const totalDuration = Date.now() - overallStart;
    const overallSuccess = clinicResults.every((r) => r.result.success);
    
    console.log(`[AvailabilitySync] Full sync completed in ${totalDuration}ms`);
    console.log(`[AvailabilitySync] Synced ${clinicResults.length} clinics`);
    console.log(`[AvailabilitySync] Total errors: ${allErrors.length}`);
    
    return {
      clinics: clinicResults,
      overall: {
        success: overallSuccess,
        totalDuration,
        errors: allErrors,
      },
    };
  } catch (error) {
    const totalDuration = Date.now() - overallStart;
    const errorMsg = `Full availability sync failed: ${error}`;
    console.error(`[AvailabilitySync] ${errorMsg}`);
    
    return {
      clinics: clinicResults,
      overall: {
        success: false,
        totalDuration,
        errors: [errorMsg],
      },
    };
  }
}
