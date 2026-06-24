import { TopBar } from "@/shared/ui";
import { TeamInsightsDashboard } from "@/features/insights/presentation/components/TeamInsightsDashboard";

export const metadata = {
  title: "Team Insights · People Analytics",
};

export default function TeamInsightsPage() {
  return (
    <div className="flex h-full flex-col">
      <TopBar className="lg:hidden" title="Team Insights" kicker="People Analytics" />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="mx-auto max-w-5xl px-[18px] py-4 lg:px-6">
          <TeamInsightsDashboard />
        </div>
      </div>
    </div>
  );
}
