import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";

export default function RegisterScreen() {
  return (
    <Screen>
      <Header title="Create Account" subtitle="Registration UI will be added later." />
      <Card title="New lifter profile">
        <EmptyState title="Registration coming later" message="Profile setup stays local for now." />
      </Card>
    </Screen>
  );
}
