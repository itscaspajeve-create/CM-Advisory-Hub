import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { Client, Policy } from "@/lib/types";
import { ClientDetail } from "@/components/clients/client-detail";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: client }, { data: policies }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("policies")
      .select("*")
      .eq("client_id", params.id)
      .order("issue_date", { ascending: false }),
  ]);

  if (!client) notFound();

  return (
    <div>
      <Link
        href="/clients"
        className="mb-3 inline-flex min-h-[44px] items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:min-h-0"
      >
        <ArrowLeft className="h-4 w-4" /> All clients
      </Link>
      <ClientDetail
        client={client as Client}
        policies={(policies ?? []) as Policy[]}
      />
    </div>
  );
}
