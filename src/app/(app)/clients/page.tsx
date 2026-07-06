import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ClientsView } from "@/components/clients/clients-view";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*, policies(count)")
    .order("full_name");

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients?.length ?? 0} total`}
      />
      <ClientsView clients={clients ?? []} />
    </div>
  );
}
