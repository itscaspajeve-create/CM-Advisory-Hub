import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import type { CommissionWithPolicy } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { CommissionsView } from "@/components/commissions/commissions-view";

export const metadata: Metadata = { title: "Commissions" };
export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
  const supabase = createClient();
  const [{ data: commissions }, { data: policies }] = await Promise.all([
    supabase
      .from("commissions")
      .select("*, policies(id, policy_number, product_name, clients(id, full_name))")
      .order("expected_date", { ascending: false }),
    supabase
      .from("policies")
      .select("id, policy_number, product_name, clients(full_name)")
      .order("created_at", { ascending: false }),
  ]);

  const policyOptions = (policies ?? []).map((p) => {
    const client = Array.isArray(p.clients)
      ? (p.clients[0] as { full_name: string } | undefined)
      : (p.clients as { full_name: string } | null);
    return {
      id: p.id as string,
      label: `${p.product_name} · #${p.policy_number}${client ? ` · ${client.full_name}` : ""}`,
    };
  });

  return (
    <div>
      <PageHeader title="Commissions" description="Track expected and received earnings" />
      <CommissionsView
        commissions={(commissions ?? []) as unknown as CommissionWithPolicy[]}
        policyOptions={policyOptions}
      />
    </div>
  );
}
