"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Cake,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";

import { createClient as createSupabase } from "@/lib/supabase/client";
import type { Client, Policy } from "@/lib/types";
import {
  ageFromDob,
  formatCurrency,
  formatDate,
  policyApe,
  premiumModeLabel,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClientForm } from "@/components/clients/client-form";
import { ClientStatusBadge, PolicyStatusBadge } from "@/components/clients/status-badge";
import { PolicyForm } from "@/components/policies/policy-form";

interface ClientDetailProps {
  client: Client;
  policies: Policy[];
}

export function ClientDetail({ client, policies }: ClientDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [policyFormOpen, setPolicyFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | undefined>();
  const [deletingPolicy, setDeletingPolicy] = useState<Policy | undefined>();

  const age = ageFromDob(client.date_of_birth);
  const totalApe = policies
    .filter((p) => p.status === "inforce")
    .reduce((s, p) => s + policyApe(p), 0);

  async function deleteClient() {
    await createSupabase().from("clients").delete().eq("id", client.id);
    router.push("/clients");
    router.refresh();
  }

  async function deletePolicy() {
    if (!deletingPolicy) return;
    await createSupabase().from("policies").delete().eq("id", deletingPolicy.id);
    setDeletingPolicy(undefined);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Client info */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{client.full_name}</CardTitle>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Client since {formatDate(client.client_since)}
              {client.client_source ? ` · ${client.client_source}` : ""}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Client actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil /> Edit client
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 /> Delete client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
            >
              <Phone className="h-4 w-4" /> {client.phone}
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-2 text-primary underline-offset-4 hover:underline"
            >
              <Mail className="h-4 w-4" /> {client.email}
            </a>
          )}
          {client.date_of_birth && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Cake className="h-4 w-4" />
              {formatDate(client.date_of_birth)}
              {age != null ? ` (${age} yrs)` : ""}
            </span>
          )}
          {client.occupation && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" /> {client.occupation}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Policies */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Policies ({policies.length})</h2>
          {totalApe > 0 && (
            <p className="text-sm text-muted-foreground">
              In-force APE: {formatCurrency(totalApe)}
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingPolicy(undefined);
            setPolicyFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No policies yet for this client.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {policies.map((p) => (
            <li key={p.id}>
              <Card>
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{p.product_name}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      #{p.policy_number}
                      {p.product_type ? ` · ${p.product_type}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <PolicyStatusBadge status={p.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Policy actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingPolicy(p);
                            setPolicyFormOpen(true);
                          }}
                        >
                          <Pencil /> Edit policy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingPolicy(p)}
                        >
                          <Trash2 /> Delete policy
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <Detail label="Premium">
                    {formatCurrency(p.premium_amount, p.currency)} /{" "}
                    {premiumModeLabel(p.premium_mode)}
                  </Detail>
                  <Detail label="APE">{formatCurrency(policyApe(p), p.currency)}</Detail>
                  <Detail label="Sum assured">
                    {formatCurrency(p.sum_assured, p.currency)}
                  </Detail>
                  <Detail label="Issue date">{formatDate(p.issue_date)}</Detail>
                  <Detail label="Anniversary">
                    {formatDate(p.policy_anniversary ?? p.issue_date)}
                  </Detail>
                  <Detail label="Payment">{p.payment_method ?? "—"}</Detail>
                  {p.payor && <Detail label="Payor">{p.payor}</Detail>}
                  {p.riders && (
                    <Detail label="Riders" wide>
                      {p.riders}
                    </Detail>
                  )}
                  {p.fund_allocation && (
                    <Detail label="Funds" wide>
                      {p.fund_allocation}
                    </Detail>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ClientForm
        key={editOpen ? "open" : "closed"}
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
      />
      <PolicyForm
        key={policyFormOpen ? editingPolicy?.id ?? "new" : "closed"}
        open={policyFormOpen}
        onOpenChange={setPolicyFormOpen}
        clientId={client.id}
        policy={editingPolicy}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {client.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the client and all {policies.length}{" "}
              linked {policies.length === 1 ? "policy" : "policies"} (and their
              commissions). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={deleteClient}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingPolicy}
        onOpenChange={(o) => !o && setDeletingPolicy(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete policy #{deletingPolicy?.policy_number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This also removes commissions logged against it. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={deletePolicy}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Detail({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{children}</p>
    </div>
  );
}
