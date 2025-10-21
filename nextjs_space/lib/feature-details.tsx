
import { TrendingUp, Users, Target, BarChart3, Sparkles, Zap, CheckCircle, TrendingDown, Clock, DollarSign, AlertTriangle, Shield } from "lucide-react"
import { FeatureDetail } from "@/components/landing/feature-modal"

export const featureDetails: FeatureDetail[] = [
  {
    id: "revenue-intelligence",
    title: "Revenue Intelligence",
    icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
    shortDescription: "Få konkreta intäktsförslag baserat på din bokhistorik. Se exakt vilka åtgärder som ger mest avkastning.",
    why: {
      title: "Varför behöver du detta?",
      content: "De flesta kliniker går miste om 15-30% av sina potentiella intäkter bara för att de inte ser möjligheterna i sin egen data. Du har guld i din bokningshistorik - men utan rätt verktyg ser du bara grafer, inte pengar."
    },
    how: {
      title: "Så fungerar det",
      steps: [
        "Flow analyserar din bokningshistorik, behandlingstyper, priser och kundflöden automatiskt varje natt",
        "AI:n identifierar mönster som du missar - tomma tider, underprissatta behandlingar, missade upsell-möjligheter",
        "Du får konkreta åtgärdsförslag varje morgon: 'Öka pris på laser fredagar kl 14-17 med 15% = +12.500 kr/mån'",
        "Implementera förslagen med ett klick - eller ignorera de du inte känner för"
      ]
    },
    what: {
      title: "Vad får du?",
      benefits: [
        { icon: <DollarSign className="h-6 w-6" />, text: "Genomsnittlig intäktsökning på 18-25% inom 3 månader" },
        { icon: <Clock className="h-6 w-6" />, text: "Dagliga actionable insights - inte bara data" },
        { icon: <TrendingUp className="h-6 w-6" />, text: "Optimering baserad på verklig efterfrågan, inte gissningar" },
        { icon: <CheckCircle className="h-6 w-6" />, text: "Automatisk bevakning av tillväxtmöjligheter 24/7" }
      ]
    },
    realExample: {
      clinic: "ArchClinic",
      challenge: "Hade 68% beläggningsgrad men såg inte var pengarna läckte",
      result: "Flow identifierade 12 timmars outnyttjad högefterfrågan-tid per vecka + 3 underprissatta behandlingar",
      metric: "+23% intäkter på 8 veckor"
    }
  },
  {
    id: "customer-health-scoring",
    title: "Customer Health Scoring",
    icon: <Users className="h-8 w-8 text-purple-600" />,
    shortDescription: "Se vilka kunder som riskerar att försvinna och agera i tid. Få konkreta tips för att öka lojalitet.",
    why: {
      title: "Varför är detta kritiskt?",
      content: "Det kostar 5x mer att skaffa en ny kund än att behålla en befintlig. Men hur vet du vilka kunder som är på väg att försvinna innan det är för sent? De flesta kliniker ser problemet först när kunden redan är borta."
    },
    how: {
      title: "Så räddas dina kunder",
      steps: [
        "Flow analyserar kundernas bokningsfrekvens, behandlingstyper, feedback och engagemang",
        "Varje kund får en health score (0-100) som uppdateras dagligen baserat på beteendemönster",
        "När en kund riskerar att churn får du en varning: 'Emma besökte dig 1 gång/månad i 8 månader - nu har hon missat 2 månader'",
        "Flow föreslår konkret action: 'Skicka 20% rabatt-SMS till Emma på hennes favoritbehandling inom 48 timmar'"
      ]
    },
    what: {
      title: "Resultatet",
      benefits: [
        { icon: <Shield className="h-6 w-6" />, text: "Minska customer churn med 40-60%" },
        { icon: <AlertTriangle className="h-6 w-6" />, text: "Proaktiva varningar innan kunden försvinner" },
        { icon: <CheckCircle className="h-6 w-6" />, text: "Automatiska win-back kampanjer" },
        { icon: <TrendingUp className="h-6 w-6" />, text: "Högre customer lifetime value (LTV)" }
      ]
    },
    realExample: {
      clinic: "Glow Beauty Stockholm",
      challenge: "Tappade 30% av kunderna efter första besöket utan att märka det",
      result: "Health scoring identifierade at-risk kunder tidigt och automatiska SMS-påminnelser räddade 65% av dem",
      metric: "+47% retention rate"
    }
  },
  {
    id: "dynamic-pricing",
    title: "Dynamic Pricing",
    icon: <Target className="h-8 w-8 text-indigo-600" />,
    shortDescription: "Optimera dina priser baserat på efterfrågan. \"Öka priser 10% på fredagar kl 14-17\" = +15k kr/mån.",
    why: {
      title: "Varför fast pris kostar dig pengar",
      content: "Flygbolag, hotell och Uber har förstått det länge: efterfrågan varierar, så borde priserna göra det. Din klinik är stressad på fredagar kl 15-18 men tom på måndagar kl 10-13. Varför samma pris? Du lämnar pengar på bordet."
    },
    how: {
      title: "Så optimeras dina priser",
      steps: [
        "Flow analyserar din efterfrågan per timme, dag och vecka för varje behandlingstyp",
        "AI:n jämför med marknadspriser, dina kostnader och customer willingness to pay",
        "Du får konkreta prisförslag: 'Öka laser-behandling fredagar kl 14-17 från 1.200 kr till 1.350 kr'",
        "Testa förslagen live - Flow mäter impact och justerar automatiskt eller låter dig bestämma"
      ]
    },
    what: {
      title: "Vad händer",
      benefits: [
        { icon: <DollarSign className="h-6 w-6" />, text: "Genomsnittlig intäktsökning 12-18% utan fler kunder" },
        { icon: <Target className="h-6 w-6" />, text: "Jämna ut efterfrågan - fyll tomma tider med lägre priser" },
        { icon: <TrendingUp className="h-6 w-6" />, text: "Maximera intäkter under peak hours" },
        { icon: <CheckCircle className="h-6 w-6" />, text: "A/B-testning av priser för att hitta sweet spot" }
      ]
    },
    realExample: {
      clinic: "Radiance Malmö",
      challenge: "Fullbokade fredagar men tom måndagar - tappade potential på båda hållen",
      result: "Dynamic pricing ökade fredagspriser 15% (kunderna köpte ändå) + sänkte måndagspriser 10% (fyllde kalendern)",
      metric: "+15.300 kr/mån"
    }
  },
  {
    id: "meta-marketing-roi",
    title: "Meta Marketing ROI",
    icon: <BarChart3 className="h-8 w-8 text-green-600" />,
    shortDescription: "Se exakt vilka annonser som ger bokningar, inte bara klick. Optimera din marknadsföring för maximal avkastning.",
    why: {
      title: "Varför slösar du pengar på ads?",
      content: "Du betalar 5.000 kr/månad för Facebook-annonser. Du ser klick, likes och kommentarer. Men hur många faktiska bokningar gav det? Vilken annons drog in mest pengar? Du vet inte - så du fortsätter betala för ads som inte funkar."
    },
    how: {
      title: "Så får du riktig ROI",
      steps: [
        "Anslut ditt Meta Ads-konto till Flow med ett klick (OAuth, tar 30 sekunder)",
        "Flow synkar automatiskt alla dina kampanjer, ad sets och enskilda annonser",
        "Varje bokning trackas tillbaka till exakt vilken annons som drev kunden till dig",
        "Du ser live: 'Ad A kostade 1.200 kr och gav 8 bokningar = 15.600 kr intäkt. Ad B kostade 800 kr och gav 2 bokningar = 2.400 kr intäkt. Pausa Ad B.'"
      ]
    },
    what: {
      title: "Vad får du?",
      benefits: [
        { icon: <BarChart3 className="h-6 w-6" />, text: "Exakt ROI per kampanj, ad set och annons" },
        { icon: <TrendingDown className="h-6 w-6" />, text: "Sluta slösa pengar på annonser som inte konverterar" },
        { icon: <DollarSign className="h-6 w-6" />, text: "Dubbla ROI på samma budget genom att optimera" },
        { icon: <Target className="h-6 w-6" />, text: "Se vilka målgrupper som faktiskt bokar" }
      ]
    },
    realExample: {
      clinic: "Urban Wellness Göteborg",
      challenge: "Spenderade 8.000 kr/mån på Meta Ads men såg bara klick, inte bokningar",
      result: "Flow visade att 3 av 7 kampanjer drog 90% av bokningarna. Omprioriterade budget till vinnarna.",
      metric: "140% ROI-ökning"
    }
  },
  {
    id: "no-show-prevention",
    title: "Risk-varningar för no-shows",
    icon: <Sparkles className="h-8 w-8 text-orange-600" />,
    shortDescription: "Identifiera riskbokningar innan de blir no-shows. Få varningar i tid så du kan agera proaktivt och rädda bokningar.",
    why: {
      title: "Varför no-shows dödar din business",
      content: "En no-show kostar dig inte bara den utebliva intäkten - det är också en tom stol som någon annan kunde betalat för. Vid 20% no-show-rate på en klinik med 500 bokningar/månad å 800 kr = 80.000 kr i röken per månad."
    },
    how: {
      title: "Så förutsäger och förhindrar Flow no-shows",
      steps: [
        "AI-modellen tränas på historiska no-shows och hittar patterns: nya kunder, sena bokningar, fredagar, regniga dagar, etc.",
        "Varje bokning får en risk-score 0-100% baserat på 20+ faktorer",
        "När en bokning har >60% no-show-risk får du en alert: 'Ahmed bokade sent för fredag kl 17 - ny kund - 73% risk'",
        "Flow skickar automatisk SMS-påminnelse till högriskkunder 24h innan + follow-up 2h innan"
      ]
    },
    what: {
      title: "Resultatet",
      benefits: [
        { icon: <AlertTriangle className="h-6 w-6" />, text: "Minska no-shows med 50-70%" },
        { icon: <DollarSign className="h-6 w-6" />, text: "Rädda 30.000-80.000 kr/månad i förlorade intäkter" },
        { icon: <CheckCircle className="h-6 w-6" />, text: "Automatiska påminnelser till högrisk-bokningar" },
        { icon: <Clock className="h-6 w-6" />, text: "Få tid att boka om stolen om kunden ändå inte kommer" }
      ]
    },
    realExample: {
      clinic: "Urban Wellness Göteborg",
      challenge: "30-40% no-shows på fredagar - tappade 50.000 kr/månad",
      result: "AI-modellen identifierade högrisk-bokningar och automatiska SMS + telefonuppföljningar räddade 75% av dem",
      metric: "-68% no-shows"
    }
  },
  {
    id: "automatic-integration",
    title: "Automatisk integration",
    icon: <Zap className="h-8 w-8 text-pink-600" />,
    shortDescription: "Anslut ditt bokningssystem och få automatisk realtidssynk av alla bokningar och kunder. Ingen manuell administration.",
    why: {
      title: "Varför manuellt arbete är slöseri",
      content: "Du betalar redan för Bokadirekt/annan bokningssystem. Varför ska du OCKSÅ manuellt föra över data till Excel, manuellt räkna metrics, manuellt skicka påminnelser? Du är klinikägare, inte dataentré-person."
    },
    how: {
      title: "Så enkelt är det",
      steps: [
        "Anslut ditt bokningssystem (Bokadirekt, Timely, etc.) med API-nyckel - tar 2 minuter",
        "Flow synkar automatiskt alla bokningar, kunder, behandlingar, priser och staff varje timme (eller realtid)",
        "All data flödar automatiskt in i Flow's AI-motor utan att du behöver göra något",
        "Du fokuserar på klinikens kärna medan Flow håller koll på business intelligence"
      ]
    },
    what: {
      title: "Vad slipper du?",
      benefits: [
        { icon: <Clock className="h-6 w-6" />, text: "Spara 8-12 timmar/vecka på manuell administration" },
        { icon: <Zap className="h-6 w-6" />, text: "Realtidsdata istället för föråldrade Excel-filer" },
        { icon: <CheckCircle className="h-6 w-6" />, text: "Inga manuella fel eller missade uppdateringar" },
        { icon: <Shield className="h-6 w-6" />, text: "GDPR-compliant och säker datahantering" }
      ]
    },
    realExample: {
      clinic: "Glow Beauty Stockholm",
      challenge: "Spenderade 10 timmar/vecka på att exportera data från Bokadirekt och räkna metrics i Excel",
      result: "Flow anslöt till Bokadirekt API och automatiserade allt - all data synkas varje timme automatiskt",
      metric: "10 tim/vecka sparade"
    }
  }
]

export function getFeatureById(id: string): FeatureDetail | undefined {
  return featureDetails.find(f => f.id === id)
}
