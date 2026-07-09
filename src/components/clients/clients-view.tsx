"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Mars, Phone, Plus, Search, Venus } from "lucide-react";

import type { Client } from "@/lib/types";
import { CLIENT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ClientForm } from "@/components/clients/client-form";
import { ClientStatusBadge } from "@/components/clients/status-badge";

type ClientWithCount = Client & { policies: { count: number }[] };

/** Small colored icon indicating the client's gender (male / female). */
function GenderIcon({ gender }: { gender: Client["gender"] }) {
  if (gender === "male")
    return (
      <Mars className="h-4 w-4 shrink-0 text-blue-500" aria-label="Male" />
    );
  if (gender === "female")
    return (
      <Venus className="h-4 w-4 shrink-0 text-pink-500" aria-label="Female" />
    );
  return null;
}

interface ClientsViewProps {
  clients: ClientWithCount[];
}

export function ClientsView({ clients }: ClientsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return [c.full_name, c.phone, c.email, c.occupation]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [clients, search, status]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CLIENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setFormOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add client</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {clients.length === 0
              ? "No clients yet — add your first client to get started."
              : "No clients match your search."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="space-y-2 md:hidden">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`}>
                  <Card className="transition-colors active:bg-accent">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <GenderIcon gender={c.gender} />
                          <p className="truncate font-medium">{c.full_name}</p>
                          <ClientStatusBadge status={c.status} />
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                          {c.phone && (
                            <>
                              <Phone className="h-3 w-3" /> {c.phone} ·{" "}
                            </>
                          )}
                          {c.policies?.[0]?.count ?? 0}{" "}
                          {(c.policies?.[0]?.count ?? 0) === 1
                            ? "policy"
                            : "policies"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Occupation</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Client since</TableHead>
                  <TableHead>Policies</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/clients/${c.id}`)}
                  >
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <GenderIcon gender={c.gender} />
                        {c.full_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.occupation ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.client_source ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.client_since)}</TableCell>
                    <TableCell className="tabular-nums">{c.policies?.[0]?.count ?? 0}</TableCell>
                    <TableCell><ClientStatusBadge status={c.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <ClientForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
