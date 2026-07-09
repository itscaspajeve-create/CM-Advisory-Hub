-- Adds an outreach/reminder state to policies, surfaced on the Renewals page.
-- Values: 'to_contact' (needs outreach), 'contacting_done' (client contacted),
-- 'policy_review' (flagged for a policy review). NULL = no reminder set.

alter table public.policies
  add column if not exists reminder_status text
    check (reminder_status in ('to_contact', 'contacting_done', 'policy_review'));
