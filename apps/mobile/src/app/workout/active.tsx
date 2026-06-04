import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";

export default function ActiveWorkoutScreen() {
  return (
    <Screen>
      <Header title="Active Workout" subtitle="Local workout builder placeholder." />
      <Card title="Workout session">
        <EmptyState title="Workout builder" message="Active workout controls will be added later." />
      </Card>
    </Screen>
  );
}
