import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";

export default function AIScreen() {
  return (
    <Screen>
      <Header title="AI" subtitle="Review training feedback without turning this into chat." />
      <Card title="Latest insight">
        <EmptyState title="Training insight" message="Local AI-style reports will appear here." />
      </Card>
    </Screen>
  );
}
