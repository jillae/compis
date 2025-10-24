
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CashFlowAnalysis from "@/components/analytics/cash-flow-analysis";

export const metadata = {
  title: "Kassaflödesanalys | Flow",
  description: "Jämför Bokadirekt försäljning med Nordea banktransaktioner",
};

export default async function CashFlowPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto py-8">
      <CashFlowAnalysis />
    </div>
  );
}
