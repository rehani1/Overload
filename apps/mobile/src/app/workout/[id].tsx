import { useLocalSearchParams } from "expo-router";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <Header title="Workout Detail" subtitle="Workout history detail placeholder." />
      <Card title="Workout ID">
        <EmptyState title={String(id)} message="Workout detail view will be added later." />
      </Card>
    </Screen>
  );
}
