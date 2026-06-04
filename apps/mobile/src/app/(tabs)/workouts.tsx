import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";

export default function WorkoutsScreen() {
  return (
    <Screen>
      <Header title="Workouts" subtitle="Browse completed sessions and repeat useful templates." />
      <Card title="History">
        <EmptyState title="Workout history" message="Completed sessions will appear here." />
      </Card>
    </Screen>
  );
}
