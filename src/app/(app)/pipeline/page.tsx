import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import type { PipelineItem } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineView } from "@/components/pipeline/pipeline-view";

export const metadata: Metadata = { title: "Pipeline" };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("pipeline")
    .select("*")
    .order("next_followup_date", { ascending: true, nullsFirst: false });

  return (
    <div>
      <PageHeader title="Sales Pipeline" description="Track prospects from lead to close" />
      <PipelineView items={(items ?? []) as PipelineItem[]} />
    </div>
  );
}
