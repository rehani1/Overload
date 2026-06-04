import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";

export default function ProgressScreen() {
  return (
    <Screen>
      <Header title="Progress" subtitle="Quick checks for consistency, volume, and top lifts." />
      <Card title="Progress summary">
        <EmptyState title="Progress snapshot" message="Weekly training stats will appear here." />
      </Card>
    </Screen>
  );
}
