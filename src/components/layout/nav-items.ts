import {
  Bell,
  LayoutDashboard,
  Users,
  KanbanSquare,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile bottom bar */
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", shortLabel: "Clients", icon: Users },
  { href: "/pipeline", label: "Pipeline", shortLabel: "Pipeline", icon: KanbanSquare },
  { href: "/commissions", label: "Commissions", shortLabel: "Comms", icon: Wallet },
  { href: "/renewals", label: "Renewals", shortLabel: "Renewals", icon: Bell },
];
