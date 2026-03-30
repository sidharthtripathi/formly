import { ReactNode } from "react";
import { Sidebar } from "@/components/builder/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-0">
        {children}
      </main>
    </div>
  );
}
