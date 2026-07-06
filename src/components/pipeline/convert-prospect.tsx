"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient as createSupabase } from "@/lib/supabase/client";
import type { PipelineItem } from "@/lib/types";
import { ClientForm } from "@/components/clients/client-form";
import { PolicyForm } from "@/components/policies/policy-form";

interface ConvertProspectProps {
  prospect: PipelineItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-step conversion of a won prospect:
 * 1. create the client (prefilled with the prospect's name),
 * 2. create their first policy (prefilled with the proposed product/APE),
 * then mark the pipeline entry as won.
 */
export function ConvertProspect({ prospect, open, onOpenChange }: ConvertProspectProps) {
  const router = useRouter();
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  // Ref, not state: ClientForm fires onSaved and the close event in the same
  // tick, so a state flag wouldn't be visible to the close handler yet.
  const createdClientId = useRef<string | null>(null);

  async function finishConversion() {
    const supabase = createSupabase();
    await supabase
      .from("pipeline")
      .update({
        stage: "won",
        notes: [prospect.notes, "Converted to client ✔"].filter(Boolean).join("\n"),
      })
      .eq("id", prospect.id);
    router.refresh();
  }

  return (
    <>
      <ClientForm
        open={open && !newClientId}
        onOpenChange={(o) => {
          // A close caused by a successful save must not end the flow —
          // the policy step still has to run. Only a cancel closes it.
          if (!o && !createdClientId.current) onOpenChange(false);
        }}
        defaults={{
          full_name: prospect.prospect_name,
          status: "active",
          client_source: "Referral",
        }}
        onSaved={(id) => {
          createdClientId.current = id;
          setNewClientId(id);
          setPolicyOpen(true);
        }}
      />
      {newClientId && (
        <PolicyForm
          open={policyOpen}
          onOpenChange={(o) => {
            setPolicyOpen(o);
            if (!o) {
              // Policy dialog closed (saved or skipped) — wrap up either way
              finishConversion();
              onOpenChange(false);
              setNewClientId(null);
            }
          }}
          clientId={newClientId}
          defaults={{
            product_name: prospect.proposed_product ?? "",
            premium_amount: prospect.expected_ape ?? undefined,
            premium_mode: "annual",
            issue_date: new Date().toISOString().slice(0, 10),
            status: "inforce",
          }}
          onSaved={() => {
            setPolicyOpen(false);
          }}
        />
      )}
    </>
  );
}
