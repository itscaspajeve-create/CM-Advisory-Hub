"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightCircle,
  CalendarClock,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ACTIVE_PIPELINE_STAGES, PIPELINE_STAGES } from "@/lib/constants";
import type { PipelineItem, PipelineStage } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { ProspectForm } from "@/components/pipeline/prospect-form";
import { ConvertProspect } from "@/components/pipeline/convert-prospect";

interface PipelineViewProps {
  items: PipelineItem[];
}

export function PipelineView({ items }: PipelineViewProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineItem | undefined>();
  const [deleting, setDeleting] = useState<PipelineItem | undefined>();
  const [converting, setConverting] = useState<PipelineItem | undefined>();
  const [mobileStageFilter, setMobileStageFilter] = useState<string>("all");
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, PipelineItem[]>();
    for (const s of PIPELINE_STAGES) map.set(s.value, []);
    for (const item of items) map.get(item.stage)?.push(item);
    return map;
  }, [items]);

  const openApe = items
    .filter((i) => !["won", "lost"].includes(i.stage))
    .reduce((s, i) => s + (i.expected_ape ?? 0), 0);
  const weightedApe = items
    .filter((i) => !["won", "lost"].includes(i.stage))
    .reduce((s, i) => s + ((i.expected_ape ?? 0) * (i.probability ?? 50)) / 100, 0);

  async function moveToStage(item: PipelineItem, stage: PipelineStage) {
    if (item.stage === stage) return;
    await createClient().from("pipeline").update({ stage }).eq("id", item.id);
    router.refresh();
  }

  async function deleteProspect() {
    if (!deleting) return;
    await createClient().from("pipeline").delete().eq("id", deleting.id);
    setDeleting(undefined);
    router.refresh();
  }

  function cardFor(item: PipelineItem, draggable: boolean) {
    return (
      <Card
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", item.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className={cn("shadow-sm", draggable && "cursor-grab active:cursor-grabbing")}
      >
        <CardContent className="space-y-1.5 p-3">
          <div className="flex items-start justify-between gap-1">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {item.prospect_name}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-1 -mt-1 h-8 w-8"
                  aria-label="Prospect actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRightCircle className="mr-2 h-4 w-4" /> Move to stage
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel>Move to</DropdownMenuLabel>
                    {PIPELINE_STAGES.filter((s) => s.value !== item.stage).map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onClick={() => moveToStage(item, s.value)}
                      >
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {item.stage !== "lost" && (
                  <DropdownMenuItem onClick={() => setConverting(item)}>
                    <UserCheck /> Convert to client…
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setEditing(item)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleting(item)}
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {item.proposed_product && (
            <p className="truncate text-xs text-muted-foreground">
              {item.proposed_product}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {item.expected_ape != null && (
              <Badge variant="secondary" className="tabular-nums">
                {formatCurrency(item.expected_ape, "PHP", true)}
              </Badge>
            )}
            {item.probability != null && (
              <Badge variant="outline" className="tabular-nums">
                {item.probability}%
              </Badge>
            )}
          </div>
          {item.next_followup_date && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                new Date(item.next_followup_date) <= new Date()
                  ? "font-medium text-destructive"
                  : "text-muted-foreground"
              )}
            >
              <CalendarClock className="h-3 w-3" />
              Follow up {formatDate(item.next_followup_date)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Open APE: <span className="font-medium text-foreground">{formatCurrency(openApe)}</span>
          {" · "}Weighted: <span className="font-medium text-foreground">{formatCurrency(weightedApe)}</span>
        </p>
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add prospect
        </Button>
      </div>

      {/* Mobile: filterable list grouped by stage */}
      <div className="md:hidden">
        <Select value={mobileStageFilter} onValueChange={setMobileStageFilter}>
          <SelectTrigger className="mb-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label} ({byStage.get(s.value)?.length ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="space-y-5">
          {PIPELINE_STAGES.filter(
            (s) => mobileStageFilter === "all" || s.value === mobileStageFilter
          ).map((stage) => {
            const stageItems = byStage.get(stage.value) ?? [];
            if (stageItems.length === 0 && mobileStageFilter === "all") return null;
            return (
              <section key={stage.value}>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {stage.label} · {stageItems.length}
                </h2>
                <div className="space-y-2">
                  {stageItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No prospects here.</p>
                  ) : (
                    stageItems.map((item) => <div key={item.id}>{cardFor(item, false)}</div>)
                  )}
                </div>
              </section>
            );
          })}
          {items.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No prospects yet — add one to start tracking your pipeline.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Desktop: Kanban board (drag cards between columns) */}
      <div className="hidden gap-3 overflow-x-auto pb-2 md:grid md:auto-cols-[minmax(220px,1fr)] md:grid-flow-col">
        {ACTIVE_PIPELINE_STAGES.map((stage) => {
          const stageItems = byStage.get(stage.value) ?? [];
          const stageApe = stageItems.reduce((s, i) => s + (i.expected_ape ?? 0), 0);
          return (
            <div
              key={stage.value}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.value);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                const id = e.dataTransfer.getData("text/plain");
                const item = items.find((i) => i.id === id);
                if (item) moveToStage(item, stage.value);
              }}
              className={cn(
                "flex min-h-[240px] flex-col rounded-xl border bg-muted/40 p-2 transition-colors",
                dragOverStage === stage.value && "border-primary bg-primary/5"
              )}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{stage.label}</h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {stageItems.length} · {formatCurrency(stageApe, "PHP", true)}
                </span>
              </div>
              <div className="space-y-2">
                {stageItems.map((item) => (
                  <div key={item.id}>{cardFor(item, true)}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: won / lost summary rows */}
      <div className="mt-4 hidden grid-cols-2 gap-3 md:grid">
        {(["won", "lost"] as const).map((terminal) => {
          const list = byStage.get(terminal) ?? [];
          return (
            <div key={terminal} className="rounded-xl border bg-muted/40 p-3">
              <h2 className="mb-2 text-sm font-semibold capitalize">
                {terminal} · {list.length}
              </h2>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None yet.</p>
                ) : (
                  list.map((item) => <div key={item.id}>{cardFor(item, false)}</div>)
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ProspectForm
        key={formOpen || editing ? editing?.id ?? "new" : "closed"}
        open={formOpen || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setFormOpen(false);
            setEditing(undefined);
          }
        }}
        prospect={editing}
      />

      {converting && (
        <ConvertProspect
          key={converting.id}
          prospect={converting}
          open={!!converting}
          onOpenChange={(o) => !o && setConverting(undefined)}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.prospect_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the prospect from your pipeline. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={deleteProspect}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
