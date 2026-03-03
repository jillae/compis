import { TrendingUp, Users, Target, BarChart3, Sparkles, Zap, CheckCircle, DollarSign, Clock, Shield, Bell, LineChart } from "lucide-react"
import { FeatureDetail } from "@/components/landing/feature-modal"

export const featureDetails: FeatureDetail[] = [
  {
    id: "revenue-intelligence",
    title: "Revenue Intelligence",
    icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
    shortDescription: "AI-driven intäktsanalys som ger dig konkreta åtgärder",
    why: {
      title: "Varför Revenue Intelligence?",
      content: "De flesta kliniker har tillgång till bokningsdata men saknar verktyg för att omvandla den till konkreta affärsbeslut. Revenue Intelligence analyserar dina bokningar, identifierar mönster och ger dig specifika åtgärder som ökar intäkterna — inte bara grafer och siffror."
    },
    how: {
      title: "Så fungerar det",
      steps: [
        "Flow samlar in och analyserar din bokningshistorik automatiskt",
        "AI identifierar mönster: populära tider, outnyttjad kapacitet, säsongssvängningar",
        "Du får konkreta förslag: 'Lägg till en extra behandlare på torsdagar kl 14-18 — potential: +12k kr/mån'",
        "Följ upp effekten i realtid och justera löpande"
      ]
    },
    what: {
      title: "Vad du får",
      benefits: [
        { icon: <DollarSign className="h-5 w-5" />, text: "Konkreta intäktsförslag med beräknad potential i kronor" },
        { icon: <Clock className="h-5 w-5" />, text: "Identifiering av outnyttjad kapacitet — timmar som kan fyllas" },
        { icon: <LineChart className="h-5 w-5" />, text: "Trendanalys som visar vart din klinik är på väg" },
        { icon: <CheckCircle className="h-5 w-5" />, text: "Veckorapporter med prioriterade åtgärder" }
      ]
    },
    realExample: {
      clinic: "Glow Beauty Stockholm",
      challenge: "12 timmar outnyttjad kapacitet per vecka utan att veta vilka tider som var mest lönsamma att fylla",
      result: "Flow identifierade att tisdag-onsdag eftermiddagar hade högst konvertering från erbjudanden. Riktade kampanjer fyllde 9 av 12 timmar.",
      metric: "+18% intäkter"
    }
  },
  {
    id: "customer-health-scoring",
    title: "Customer Health Scoring",
    icon: <Users className="h-8 w-8 text-purple-600" />,
    shortDescription: "Se vilka kunder som riskerar att försvinna — och agera i tid",
    why: {
      title: "Varför Customer Health Scoring?",
      content: "Att förlora en befintlig kund kostar 5-7x mer än att behålla den. De flesta kliniker märker inte att kunder slutar komma förrän det är för sent. Customer Health Scoring identifierar riskbeteenden tidigt så du kan agera proaktivt."
    },
    how: {
      title: "Så fungerar det",
      steps: [
        "Varje kund får ett hälsopoäng (0-100) baserat på besöksfrekvens, avbokningar och engagement",
        "AI jämför kundens beteende med historiska mönster för att förutsäga risk",
        "Du får varningar när kunder börjar visa tecken på att de tänker sluta",
        "Konkreta åtgärdsförslag: personligt SMS, rabatterbjudande eller uppföljningssamtal"
      ]
    },
    what: {
      title: "Vad du får",
      benefits: [
        { icon: <Shield className="h-5 w-5" />, text: "Tidig varning när kunder riskerar att försvinna" },
        { icon: <Bell className="h-5 w-5" />, text: "Automatiska påminnelser till personal att följa upp" },
        { icon: <Users className="h-5 w-5" />, text: "Segmentering: VIP, lojala, at-risk, förlorade" },
        { icon: <CheckCircle className="h-5 w-5" />, text: "Beräknat kundlivstidsvärde (CLV) per segment" }
      ]
    },
    realExample: {
      clinic: "Urban Wellness Göteborg",
      challenge: "Tappade 15% av sina mest lönsamma kunder utan att märka det i tid",
      result: "Med hälsopoäng identifierades 23 at-risk VIP-kunder. Personlig uppföljning räddade 19 av dem.",
      metric: "-67% kundtapp"
    }
  },
  {
    id: "dynamic-pricing",
    title: "Dynamic Pricing",
    icon: <Target className="h-8 w-8 text-indigo-600" />,
    shortDescription: "Optimera priser baserat på efterfrågan — automatiskt",
    why: {
      title: "Varför Dynamic Pricing?",
      content: "De flesta kliniker har samma pris oavsett dag och tid. Men efterfrågan varierar enormt — fredagar kl 14-17 kan vara 3x mer eftertraktade än tisdagar kl 09. Dynamic Pricing hjälper dig ta rätt pris vid rätt tid, precis som flygbolag och hotell gör."
    },
    how: {
      title: "Så fungerar det",
      steps: [
        "Flow analyserar din bokningshistorik och identifierar hög- och lågbelastningstider",
        "Du sätter regler: 'Max +15% på peak-tider, max -10% på lågtrafik'",
        "Prisförslag genereras automatiskt per tjänst, dag och tid",
        "Du godkänner eller justerar — full kontroll hela tiden"
      ]
    },
    what: {
      title: "Vad du får",
      benefits: [
        { icon: <DollarSign className="h-5 w-5" />, text: "Högre intäkter på populära tider utan att förlora kunder" },
        { icon: <Clock className="h-5 w-5" />, text: "Jämnare beläggning genom att locka kunder till lugna tider" },
        { icon: <Target className="h-5 w-5" />, text: "Simuleringsverktyg: se effekten innan du aktiverar" },
        { icon: <CheckCircle className="h-5 w-5" />, text: "Full kontroll — du bestämmer min/max-gränser" }
      ]
    },
    realExample: {
      clinic: "Radiance Malmö",
      challenge: "Fredagar kl 14-17 var alltid fullbokade medan onsdag förmiddagar stod tomma",
      result: "Höjde fredagspriser 15% och erbjöd 10% rabatt på onsdagar. Onsdagsbeläggningen ökade 40%.",
      metric: "+23k kr/mån"
    }
  },
  {
    id: "meta-marketing-roi",
    title: "Meta Marketing ROI",
    icon: <BarChart3 className="h-8 w-8 text-green-600" />,
    shortDescription: "Se vilka annonser som ger bokningar — inte bara klick",
    why: {
      title: "Varför Marketing ROI?",
      content: "De flesta kliniker spenderar tusentals kronor på Meta-annonser utan att veta vilka som faktiskt leder till bokningar. Du ser klick och räckvidd, men inte om de blev betalande kunder. Marketing ROI kopplar ihop annonsdata med faktiska bokningar."
    },
    how: {
      title: "Så fungerar det",
      steps: [
        "Koppla ditt Meta Ads-konto till Flow (tar 2 minuter)",
        "Flow spårar hela kundresan: annons → klick → bokning → intäkt",
        "Se exakt vilka kampanjer, annonsgrupper och annonser som ger ROI",
        "Få automatiska förslag på budgetoptimering"
      ]
    },
    what: {
      title: "Vad du får",
      benefits: [
        { icon: <DollarSign className="h-5 w-5" />, text: "Faktisk ROI per kampanj — inte bara CTR och CPC" },
        { icon: <LineChart className="h-5 w-5" />, text: "Trendrapporter: vilka kampanjer förbättras/försämras" },
        { icon: <Target className="h-5 w-5" />, text: "Automatisk budgetrekommendation baserat på ROI" },
        { icon: <CheckCircle className="h-5 w-5" />, text: "Spårning av kundens livstidsvärde per kampanj" }
      ]
    }
  },
  {
    id: "no-show-prevention",
    title: "Risk-varningar för no-shows",
    icon: <Sparkles className="h-8 w-8 text-orange-600" />,
    shortDescription: "Identifiera riskbokningar innan de blir no-shows",
    why: {
      title: "Varför No-Show Prevention?",
      content: "No-shows kostar den genomsnittliga kliniken 50-100k kr per år i förlorade intäkter. Många bokningar som blir no-shows visar tidiga varningssignaler: sent bokade, tidigare avbokningar, lång tid sedan senaste besök. Flow identifierar dessa mönster."
    },
    how: {
      title: "Så fungerar det",
      steps: [
        "Varje bokning får ett riskpoäng baserat på kundens historik och bokningsbeteende",
        "Högrisk-bokningar flaggas automatiskt i din dashboard",
        "Du får förslag på åtgärder: bekräftelse-SMS, dubbelbokning, väntelista-backup",
        "Systemet lär sig av utfall och blir bättre över tid"
      ]
    },
    what: {
      title: "Vad du får",
      benefits: [
        { icon: <Bell className="h-5 w-5" />, text: "Automatiska varningar för högrisk-bokningar" },
        { icon: <Shield className="h-5 w-5" />, text: "Vänteliste-hantering som fyller luckor automatiskt" },
        { icon: <DollarSign className="h-5 w-5" />, text: "Beräknad kostnad per no-show för att motivera åtgärder" },
        { icon: <CheckCircle className="h-5 w-5" />, text: "Rapporter som visar förbättring över tid" }
      ]
    },
    realExample: {
      clinic: "ArchClinic",
      challenge: "22% no-show-rate på fredagar, utan verktyg för att identifiera vilka bokningar som var riskfyllda",
      result: "Flow flaggade 85% av blivande no-shows korrekt. Bekräftelse-SMS minskade no-shows till 7%.",
      metric: "-67% no-shows"
    }
  },
  {
    id: "automatic-integration",
    title: "Automatisk integration",
    icon: <Zap className="h-8 w-8 text-pink-600" />,
    shortDescription: "Koppla ditt bokningssystem — ingen manuell administration",
    why: {
      title: "Varför automatisk integration?",
      content: "Manuell datainmatning tar tid, skapar fel och gör att du alltid ligger efter. Med automatisk integration synkas dina bokningar, kunder och tjänster i realtid. Du behöver aldrig logga in någon annanstans — allt finns i Flow."
    },
    how: {
      title: "Så fungerar det",
      steps: [
        "Välj ditt bokningssystem (Bokadirekt, Timma, etc.) och logga in",
        "Flow synkar automatiskt alla befintliga bokningar och kunder",
        "Nya bokningar och ändringar synkas i realtid via webhooks",
        "All data stannar krypterad och GDPR-säkrad på svenska servrar"
      ]
    },
    what: {
      title: "Vad du får",
      benefits: [
        { icon: <Zap className="h-5 w-5" />, text: "Realtidssynk — nya bokningar visas direkt i Flow" },
        { icon: <Clock className="h-5 w-5" />, text: "Noll manuellt arbete — allt sker automatiskt" },
        { icon: <Shield className="h-5 w-5" />, text: "GDPR-compliant med krypterad dataöverföring" },
        { icon: <CheckCircle className="h-5 w-5" />, text: "Stöd för flera bokningssystem samtidigt" }
      ]
    }
  }
]
