import { AppProvider } from "@/context/AppContext";
import { DashboardShell } from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <AppProvider>
      <DashboardShell />
    </AppProvider>
  );
}
