
/**
 * Email Template System
 * Pre-built templates for marketing automation
 */

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'welcome' | 'retention' | 'milestone' | 'promotional' | 'transactional';
  subject: string;
  body: string;
  description: string;
  personalizationTokens: string[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome-new-customer',
    name: 'Welcome New Customer',
    category: 'welcome',
    subject: 'Välkommen till {clinicName}! 🎉',
    body: `Hej {firstName}!

Vi är så glada att ha dig som kund hos {clinicName}! 

Tack för att du valde oss för din första behandling. Vi hoppas att du upplevde det fantastiskt och att vi får se dig igen snart.

Som ny kund erbjuder vi dig 10% rabatt på din nästa bokning. Använd koden WELCOME10 vid din nästa bokning.

Boka enkelt via vår hemsida eller ring oss på {clinicPhone}.

Varma hälsningar,
{clinicName}`,
    description: 'Sent to new customers after their first visit',
    personalizationTokens: ['{firstName}', '{name}', '{clinicName}', '{clinicPhone}', '{totalVisits}'],
  },
  {
    id: 'at-risk-customer',
    name: 'Re-engagement (At-Risk Customer)',
    category: 'retention',
    subject: 'Vi saknar dig, {firstName}! 💙',
    body: `Hej {firstName}!

Det har gått ett tag sedan ditt senaste besök hos oss på {clinicName}, och vi undrar hur det går med dig? 

Vi skulle älska att få träffa dig igen! Som en del av vår värderingsstrategi erbjuder vi dig en exklusiv rabatt på 20% på din nästa behandling.

Boka din tid senast {expiryDate} för att utnyttja erbjudandet.

Har du några frågor eller funderingar? Tveka inte att kontakta oss!

Boka här: {bookingUrl}
Ring oss: {clinicPhone}

Vi hoppas ses snart!
{clinicName}`,
    description: 'Sent to customers who haven\'t visited in 60+ days',
    personalizationTokens: ['{firstName}', '{name}', '{clinicName}', '{clinicPhone}', '{bookingUrl}', '{expiryDate}'],
  },
  {
    id: 'critical-retention',
    name: 'Critical Retention (VIP Customer)',
    category: 'retention',
    subject: '🚨 {firstName}, vi vill inte förlora dig!',
    body: `Hej {firstName}!

Som en av våra mest värdefulla kunder (du har besökt oss {totalVisits} gånger och spenderat {lifetimeValue} kr) vill vi göra allt för att fortsätta ge dig den bästa upplevelsen.

Vi märker att det har gått ett tag sedan vi sågs, och vi undrar om något har hänt? 

Som VIP-kund erbjuder vi dig:
🎁 30% rabatt på din nästa behandling
⭐ Gratis uppgradering till premium-behandling
💆‍♀️ Möjlighet att boka prioriterade tider

Detta erbjudande är giltigt i 14 dagar.

Kontakta oss gärna om du har några synpunkter eller önskemål!

Boka nu: {bookingUrl}
Ring oss direkt: {clinicPhone}

Varma hälsningar,
{clinicName}`,
    description: 'Urgent re-engagement for high-value customers at critical risk',
    personalizationTokens: ['{firstName}', '{name}', '{totalVisits}', '{lifetimeValue}', '{clinicName}', '{clinicPhone}', '{bookingUrl}'],
  },
  {
    id: 'birthday-greeting',
    name: 'Birthday Greeting',
    category: 'promotional',
    subject: 'Grattis på födelsedagen, {firstName}! 🎂',
    body: `Hej {firstName}!

Grattis på födelsedagen från oss på {clinicName}! 🎉

Vi vill fira din dag med en extra present - 25% rabatt på en valfri behandling under hela födelsedagsmånaden!

Unna dig något speciellt och boka din favorit-behandling idag.

Boka här: {bookingUrl}
Eller ring oss: {clinicPhone}

Ha en underbar födelsedag!
{clinicName}`,
    description: 'Sent 7 days before customer birthday',
    personalizationTokens: ['{firstName}', '{name}', '{clinicName}', '{clinicPhone}', '{bookingUrl}'],
  },
  {
    id: 'milestone-10-visits',
    name: 'Milestone: 10 Visits',
    category: 'milestone',
    subject: '🎊 Du har nått 10 besök hos {clinicName}!',
    body: `Hej {firstName}!

Vi vill tacka dig för att du är en så trogen kund! Detta var ditt 10:e besök hos oss, och vi uppskattar verkligen ditt förtroende.

Som tack för din lojalitet erbjuder vi dig:
⭐ 15% rabatt på din nästa bokning
🎁 Ett gratis tillägg till din nästa behandling (värde 250 kr)

Du är en del av vår familj, och vi ser fram emot många fler besök!

Boka din nästa behandling: {bookingUrl}

Tack för att du valde oss!
{clinicName}`,
    description: 'Celebrates customer reaching 10 visits milestone',
    personalizationTokens: ['{firstName}', '{name}', '{totalVisits}', '{clinicName}', '{clinicPhone}', '{bookingUrl}'],
  },
  {
    id: 'seasonal-promotion',
    name: 'Seasonal Promotion',
    category: 'promotional',
    subject: '🌸 Vårkampanj: 20% rabatt på alla behandlingar!',
    body: `Hej {firstName}!

Våren är här, och vi firar med en fantastisk kampanj!

Få 20% rabatt på ALLA behandlingar under hela mars månad. Detta är det perfekta tillfället att unna dig eller prova något nytt.

Erbjudandet gäller både nya och befintliga kunder.

Boka nu och njut av vårens bästa erbjudande!

Boka här: {bookingUrl}
Ring oss: {clinicPhone}

Kampanjen gäller till och med 31 mars.

Varma hälsningar,
{clinicName}`,
    description: 'Seasonal promotional campaign (customizable)',
    personalizationTokens: ['{firstName}', '{name}', '{clinicName}', '{clinicPhone}', '{bookingUrl}'],
  },
  {
    id: 'loyalty-reward',
    name: 'Loyalty Reward',
    category: 'promotional',
    subject: 'Tack för din lojalitet! 🌟 Här är din belöning',
    body: `Hej {firstName}!

Du har varit kund hos {clinicName} i över ett år, och vi vill visa vår uppskattning!

Som tack för din lojalitet får du nu access till vårt exklusiva VIP-program:

✨ 10% permanent rabatt på alla behandlingar
📅 Prioriterad bokning av populära tider
🎁 Födelsedagspresent varje år
💌 Exklusiva erbjudanden bara för dig

Välkommen till vårt VIP-program!

Boka din nästa behandling: {bookingUrl}

Tack för att du är en del av vår familj!
{clinicName}`,
    description: 'Rewards loyal customers with VIP benefits',
    personalizationTokens: ['{firstName}', '{name}', '{clinicName}', '{clinicPhone}', '{bookingUrl}', '{totalVisits}', '{lifetimeValue}'],
  },
];

/**
 * Replace personalization tokens in template
 */
export function personalizeEmailTemplate(
  template: string,
  tokens: Record<string, string>
): string {
  let personalized = template;
  
  Object.entries(tokens).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    personalized = personalized.replace(regex, value);
  });

  return personalized;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter(t => t.category === category);
}
