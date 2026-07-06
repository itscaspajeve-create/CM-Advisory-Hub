import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <main className="px-4 pb-24 pt-4 md:ml-60 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
