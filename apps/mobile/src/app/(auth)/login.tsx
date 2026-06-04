import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";

export default function LoginScreen() {
  return (
    <Screen>
      <Header title="Log In" subtitle="Authentication UI will be added later." />
      <Card title="Overload account">
        <EmptyState title="Login coming later" message="No auth gate is wired yet." />
      </Card>
    </Screen>
  );
}
