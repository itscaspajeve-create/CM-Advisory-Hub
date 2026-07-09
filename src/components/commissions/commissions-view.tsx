"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { COMMISSION_STATUSES, COMMISSION_TYPES } from "@/lib/constants";
import type { Commission, CommissionWithPolicy } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CommissionForm,
  type PolicyOption,
} from "@/components/commissions/commission-form";
import { CommissionStatusBadge } from "@/components/clients/status-badge";

interface CommissionsViewProps {
  commissions: CommissionWithPolicy[];
  policyOptions: PolicyOption[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function typeLabel(value: string) {
  return COMMISSION_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** The month a commission belongs to for filtering: received date, else expected. */
function relevantDate(c: Commission): string | null {
  return c.received_date ?? c.expected_date;
}

export function CommissionsView({ commissions, policyOptions }: CommissionsViewProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionWithPolicy | undefined>();
  const [deleting, setDeleting] = useState<CommissionWithPolicy | undefined>();
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const year = new Date().getFullYear();

  const ytdReceived = commissions
    .filter(
      (c) =>
        c.status === "received" &&
        c.received_date &&
        new Date(c.received_date).getFullYear() === year
    )
    .reduce((s, c) => s + c.amount, 0);
  const ytdExpected = commissions
    .filter(
      (c) =>
        c.status === "expected" &&
        c.expected_date &&
        new Date(c.expected_date).getFullYear() === year
    )
    .reduce((s, c) => s + c.amount, 0);

  const filtered = useMemo(() => {
    return commissions.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (monthFilter !== "all") {
        const d = relevantDate(c);
        if (!d) return false;
        const dt = new Date(d);
        if (dt.getFullYear() !== year || dt.getMonth() !== Number(monthFilter))
          return false;
      }
      return true;
    });
  }, [commissions, monthFilter, statusFilter, year]);

  async function deleteCommission() {
    if (!deleting) return;
    await createClient().from("commissions").delete().eq("id", deleting.id);
    setDeleting(undefined);
    router.refresh();
  }

  async function markReceived(c: CommissionWithPolicy) {
    await createClient()
      .from("commissions")
      .update({
        status: "received",
        received_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", c.id);
    router.refresh();
  }

  function policyLabel(c: CommissionWithPolicy) {
    if (!c.policies) return "(deleted policy)";
    const client = c.policies.clients?.full_name;
    return `${c.policies.product_name} · #${c.policies.policy_number}${client ? ` · ${client}` : ""}`;
  }

  function actionsMenu(c: CommissionWithPolicy) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Commission actions"
            className="text-base leading-none"
          >
            −
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(c)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          {c.status !== "received" && (
            <DropdownMenuItem onClick={() => markReceived(c)}>
              <Check /> Mark received
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleting(c)}
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div>
      {/* Sticky YTD total — always visible while scrolling */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:rounded-xl md:border md:bg-card md:px-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              YTD Received
            </p>
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {formatCurrency(ytdReceived)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Still Expected
            </p>
            <p className="text-xl font-semibold tabular-nums tracking-tight text-muted-foreground">
              {formatCurrency(ytdExpected)}
            </p>
          </div>
          <div className="ml-auto">
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Log commission</span>
              <span className="sm:hidden">Log</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months ({year})</SelectItem>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {COMMISSION_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {commissions.length === 0
              ? "No commissions logged yet."
              : "Nothing matches these filters."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="space-y-2 md:hidden">
            {filtered.map((c) => (
              <li key={c.id}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold tabular-nums">
                          {formatCurrency(c.amount)}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {policyLabel(c)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <CommissionStatusBadge status={c.status} />
                        {actionsMenu(c)}
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {typeLabel(c.commission_type)}
                      {c.rate != null ? ` · ${c.rate}%` : ""} ·{" "}
                      {c.status === "received"
                        ? `Received ${formatDate(c.received_date)}`
                        : `Expected ${formatDate(c.expected_date)}`}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy / Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-[280px] truncate font-medium">
                      {policyLabel(c)}
                    </TableCell>
                    <TableCell>{typeLabel(c.commission_type)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.rate != null ? `${c.rate}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(c.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(c.expected_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(c.received_date)}
                    </TableCell>
                    <TableCell>
                      <CommissionStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>{actionsMenu(c)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <CommissionForm
        key={formOpen || editing ? editing?.id ?? "new" : "closed"}
        open={formOpen || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setFormOpen(false);
            setEditing(undefined);
          }
        }}
        policyOptions={policyOptions}
        commission={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {deleting ? formatCurrency(deleting.amount) : ""} commission?
            </AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={deleteCommission}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
