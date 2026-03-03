/**
 * LoyaltySMSAutomation
 *
 * Skickar automatiserade SMS via smsService vid lojalitetshändelser:
 *  - WELCOME        : Kund registrerar sig på lojalitetsprogram
 *  - STAMP_EARNED   : Kund får en stämpel/poäng
 *  - LEVEL_UP       : Kund uppgraderar nivå (bronze→silver→gold)
 *  - REWARD_AVAILABLE: Kund har tillräckligt för att lösa in belöning
 *  - REMINDER       : Kund har inte besökt på X dagar
 *  - BIRTHDAY       : Kund har födelsedag (om dateOfBirth finns)
 */

import { prisma } from '@/lib/db';
import { smsService } from '@/lib/sms/sms-service';

// -------------------------------------------------------------------
// Hjälpfunktion: hämta kort med alla relationer vi behöver
// -------------------------------------------------------------------
async function getCardWithRelations(cardId: string) {
  return prisma.loyaltyCard.findUnique({
    where: { id: cardId },
    include: {
      program: {
        include: {
          clinic: {
            select: { id: true, name: true },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          firstName: true,
          phone: true,
          dateOfBirth: true,
          lastVisitAt: true,
        },
      },
    },
  });
}

// -------------------------------------------------------------------
// Hjälpfunktion: format stämpelmål från redeemRule
// -------------------------------------------------------------------
function getStampTarget(redeemRule: unknown): number {
  if (!redeemRule || typeof redeemRule !== 'object') return 10;
  const rules = redeemRule as Record<string, unknown>;
  const keys = Object.keys(rules)
    .map(Number)
    .filter((n) => !isNaN(n));
  return keys.length > 0 ? Math.min(...keys) : 10;
}

// -------------------------------------------------------------------
// Klass
// -------------------------------------------------------------------
export class LoyaltySMSAutomation {
  /**
   * Skickar välkomst-SMS när ett lojalitetskort skapas
   */
  async sendWelcome(cardId: string): Promise<void> {
    const card = await getCardWithRelations(cardId);
    if (!card?.customer?.phone || !card.program.sendWelcomeSms) return;

    const clinicName = card.program.clinic.name;
    const programName = card.program.name;

    const body =
      card.program.welcomeSms ||
      `Välkommen till ${clinicName}s lojalitetsprogram! Du har registrerats med ${programName}. Samla stämplar och få belöningar! 🎉`;

    await smsService.sendEnhanced({
      clinicId: card.program.clinicId,
      customerId: card.customerId,
      to: card.customer.phone,
      message: body,
      skipConsentCheck: false,
      category: 'loyalty',
    });
  }

  /**
   * Skickar stämpelbekräftelse efter skanning
   */
  async sendStampConfirmation(
    cardId: string,
    newStamps: number,
    totalStamps: number
  ): Promise<void> {
    const card = await getCardWithRelations(cardId);
    if (!card?.customer?.phone) return;

    const programName = card.program.name;
    const target = getStampTarget(card.program.redeemRule);
    const remaining = Math.max(0, target - totalStamps);

    const message =
      remaining <= 0
        ? `Tack för besöket! Du har nu ${totalStamps} stämplar på ${programName}. Du kan lösa in en belöning – visa ditt kort! 🎁`
        : `Tack för besöket! Du har nu ${totalStamps} av ${target} stämplar på ${programName}. ${remaining} kvar till belöning!`;

    await smsService.sendEnhanced({
      clinicId: card.program.clinicId,
      customerId: card.customerId,
      to: card.customer.phone,
      message,
      skipConsentCheck: false,
      category: 'loyalty',
    });
  }

  /**
   * Skickar nivå-uppgradering (t.ex. bronze→silver)
   */
  async sendLevelUp(
    cardId: string,
    oldLevel: string,
    newLevel: string
  ): Promise<void> {
    const card = await getCardWithRelations(cardId);
    if (!card?.customer?.phone) return;

    const programName = card.program.name;
    const levelMap: Record<string, string> = {
      bronze: 'Brons',
      silver: 'Silver',
      gold: 'Guld',
    };

    const message = `Grattis! Du har nått ${levelMap[newLevel] ?? newLevel}-nivå på ${programName}! 🌟 Fortsätt samla för ännu fler förmåner.`;

    await smsService.sendEnhanced({
      clinicId: card.program.clinicId,
      customerId: card.customerId,
      to: card.customer.phone,
      message,
      skipConsentCheck: false,
      category: 'loyalty',
    });
  }

  /**
   * Skickar notis när kund har tillräckligt för att lösa in belöning
   */
  async sendRewardAvailable(
    cardId: string,
    rewardName: string
  ): Promise<void> {
    const card = await getCardWithRelations(cardId);
    if (!card?.customer?.phone) return;

    const message = `Du har en belöning att hämta: ${rewardName}! Visa ditt kort vid nästa besök hos ${card.program.clinic.name}. 🎁`;

    await smsService.sendEnhanced({
      clinicId: card.program.clinicId,
      customerId: card.customerId,
      to: card.customer.phone,
      message,
      skipConsentCheck: false,
      category: 'loyalty',
    });
  }

  /**
   * Skickar återaktiveringspåminnelse om kunden inte besökt på länge
   */
  async sendReminder(cardId: string): Promise<void> {
    const card = await getCardWithRelations(cardId);
    if (!card?.customer?.phone || !card.customer.lastVisitAt) return;

    const clinicName = card.program.clinic.name;
    const daysSince = Math.floor(
      (Date.now() - card.customer.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const body =
      card.program.reminderSms ||
      `Vi saknar dig på ${clinicName}! Det var ${daysSince} dagar sedan ditt senaste besök. Boka in dig snart! 😊`;

    await smsService.sendEnhanced({
      clinicId: card.program.clinicId,
      customerId: card.customerId,
      to: card.customer.phone,
      message: body,
      skipConsentCheck: false,
      category: 'marketing',
    });
  }

  /**
   * Skickar födelsdagshälsning med bonus
   */
  async sendBirthday(cardId: string): Promise<void> {
    const card = await getCardWithRelations(cardId);
    if (!card?.customer?.phone || !card.customer.dateOfBirth) return;

    const firstName = card.customer.firstName ?? card.customer.name ?? 'dig';
    const clinicName = card.program.clinic.name;

    const message = `Grattis på dagen, ${firstName}! 🎂 Som present från oss på ${clinicName} får du dubbla stämplar vid ditt nästa besök. Varmt välkommen!`;

    await smsService.sendEnhanced({
      clinicId: card.program.clinicId,
      customerId: card.customerId,
      to: card.customer.phone,
      message,
      skipConsentCheck: false,
      category: 'loyalty',
    });
  }
}

export const loyaltySMSAutomation = new LoyaltySMSAutomation();
