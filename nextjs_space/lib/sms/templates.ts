
import { SMSTemplate } from './types';

export const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  welcome: {
    id: 'welcome',
    name: 'Välkommen till Lojalitetsprogrammet',
    template: 'Välkommen till {clinicName}! 🎉 Du är nu medlem i vårt lojalitetsprogram. Samla stämplar och få belöningar! /KlinikFlow',
    variables: ['clinicName']
  },
  
  stamp_earned: {
    id: 'stamp_earned',
    name: 'Stämpel Registrerad',
    template: 'Grattis {firstName}! 🎊 Du fick en ny stämpel. Du har nu {currentStamps}/{totalStamps} stämplar. {remaining} stämplar kvar till belöning! /KlinikFlow',
    variables: ['firstName', 'currentStamps', 'totalStamps', 'remaining']
  },
  
  reward_earned: {
    id: 'reward_earned',
    name: 'Belöning Upplåst',
    template: 'Fantastiskt {firstName}! 🏆 Du har samlat alla stämplar och tjänat in: {rewardName}! Visa detta SMS vid ditt nästa besök. /KlinikFlow',
    variables: ['firstName', 'rewardName']
  },
  
  reward_reminder: {
    id: 'reward_reminder',
    name: 'Påminnelse om Oanvänd Belöning',
    template: 'Hej {firstName}! Du har en oanvänd belöning: {rewardName}. Glöm inte att använda den vid ditt nästa besök! /KlinikFlow',
    variables: ['firstName', 'rewardName']
  },
  
  points_expiring: {
    id: 'points_expiring',
    name: 'Poäng Går Ut Snart',
    template: 'Hej {firstName}! Dina {points} poäng går ut om {days} dagar. Boka en tid idag för att behålla dem! /KlinikFlow',
    variables: ['firstName', 'points', 'days']
  },
  
  birthday: {
    id: 'birthday',
    name: 'Grattis på Födelsedagen',
    template: 'Grattis på födelsedagen {firstName}! 🎂 Som present får du {discount}% rabatt på din nästa behandling. Boka här: {bookingLink} /KlinikFlow',
    variables: ['firstName', 'discount', 'bookingLink']
  },
  
  inactive_customer: {
    id: 'inactive_customer',
    name: 'Vi Saknar Dig',
    template: 'Hej {firstName}! Vi har inte sett dig på ett tag. Som tack för din lojalitet får du {discount}% rabatt på din nästa behandling! Boka här: {bookingLink} /KlinikFlow',
    variables: ['firstName', 'discount', 'bookingLink']
  },
  
  booking_reminder: {
    id: 'booking_reminder',
    name: 'Påminnelse om Tid',
    template: 'Hej {firstName}! Påminnelse: Du har bokat {serviceName} {date} kl {time}. Vi ses! /KlinikFlow',
    variables: ['firstName', 'serviceName', 'date', 'time']
  },
  
  campaign: {
    id: 'campaign',
    name: 'Kampanjmeddelande',
    template: '{message} /KlinikFlow',
    variables: ['message']
  }
};

export function renderTemplate(templateId: string, variables: Record<string, string>): string {
  const template = SMS_TEMPLATES[templateId];
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  let message = template.template;
  
  // Replace variables
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  
  // Check if all variables were replaced
  const unreplacedVars = message.match(/\{[^}]+\}/g);
  if (unreplacedVars) {
    console.warn(`Unresolved variables in template ${templateId}:`, unreplacedVars);
  }
  
  return message;
}

export function getTemplateVariables(templateId: string): string[] {
  const template = SMS_TEMPLATES[templateId];
  return template?.variables || [];
}

export function getAllTemplates(): SMSTemplate[] {
  return Object.values(SMS_TEMPLATES);
}
