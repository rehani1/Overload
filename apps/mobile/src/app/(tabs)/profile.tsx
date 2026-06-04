import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";

export default function ProfileScreen() {
  return (
    <Screen>
      <Header title="Profile" subtitle="Manage basic account preferences for training." />
      <Card title="Account">
        <EmptyState title="Profile settings" message="User details and preferences will appear here." />
      </Card>
    </Screen>
  );
}
