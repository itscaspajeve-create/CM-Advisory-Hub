/**
 * Database row types. Keep these in sync with supabase/migrations/*.sql.
 * When adding a field: add it to the SQL migration, then here, then to the
 * relevant form component's defaults — nothing else needs to change.
 */

export type ClientStatus = "active" | "inactive" | "prospect";
export type Gender = "male" | "female" | "other";

export interface Client {
  id: string;
  full_name: string;
  gender: Gender | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  client_source: string | null;
  client_since: string | null;
  status: ClientStatus;
  created_at: string;
}

export type PolicyStatus = "inforce" | "pending" | "lapsed" | "surrendered" | "claimed";
export type PremiumMode = "annual" | "semi_annual" | "quarterly" | "monthly" | "single";

export interface Policy {
  id: string;
  client_id: string;
  policy_number: string;
  product_name: string;
  product_type: string | null;
  currency: string;
  sum_assured: number | null;
  premium_amount: number;
  premium_mode: PremiumMode;
  payment_method: string | null;
  issue_date: string | null;
  policy_anniversary: string | null;
  payor: string | null;
  riders: string | null;
  status: PolicyStatus;
  fund_allocation: string | null;
  created_at: string;
}

export type PolicyWithClient = Policy & {
  clients: Pick<Client, "id" | "full_name" | "phone"> | null;
};

export type PipelineStage =
  | "lead"
  | "contacted"
  | "presented"
  | "proposal"
  | "closing"
  | "won"
  | "lost";

export interface PipelineItem {
  id: string;
  prospect_name: string;
  stage: PipelineStage;
  proposed_product: string | null;
  expected_ape: number | null;
  probability: number | null;
  expected_close_date: string | null;
  next_followup_date: string | null;
  notes: string | null;
  created_at: string;
}

export type CommissionStatus = "expected" | "received" | "clawback";
export type CommissionType =
  | "first_year"
  | "renewal"
  | "bonus"
  | "override"
  | "persistency";

export interface Commission {
  id: string;
  policy_id: string;
  commission_type: CommissionType;
  rate: number | null;
  amount: number;
  expected_date: string | null;
  received_date: string | null;
  status: CommissionStatus;
  created_at: string;
}

export type CommissionWithPolicy = Commission & {
  policies:
    | (Pick<Policy, "id" | "policy_number" | "product_name"> & {
        clients: Pick<Client, "id" | "full_name"> | null;
      })
    | null;
};

export interface Setting {
  key: string;
  value: string;
}
