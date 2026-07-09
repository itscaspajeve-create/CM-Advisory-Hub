'use client'

// Commissions page — self-contained app-router page (default export).
// - Pending / Received dates render on a single line (whitespace-nowrap).
// - The row action control shows "-" and reveals Edit / Mark received / Delete.
// Status values match the DB constraint: 'expected' | 'received' | 'clawback'
// ("expected" is displayed as "Pending" everywhere).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────────────────────
// Types & config
// ─────────────────────────────────────────────────────────────────────────────

type CommissionRow = {
  id: string
  policy_id: string | null
  commission_type: string
  rate: number | null
  amount: number
  expected_date: string | null
  received_date: string | null
  status: string // 'expected' | 'received' | 'clawback'
  policies: {
    policy_number: string | null
    product_name: string | null
    clients: { id: string; full_name: string } | null
  } | null
}

type PolicyOption = {
  id: string
  policy_number: string | null
  product_name: string | null
  clients: { id: string; full_name: string } | null
}

const YEARS = [2025, 2026] as const

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

const BADGE_BASE =
  'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium'

const TYPE_CONFIG: Record<string, { label: string; badge: string }> = {
  first_year: { label: 'First Year', badge: 'bg-blue-100 text-blue-700' },
  renewal: { label: 'Renewal', badge: 'bg-green-100 text-green-700' },
  bonus: { label: 'Bonus', badge: 'bg-amber-100 text-amber-800' },
}

// Matches the real DB constraint: expected | received | clawback.
// "expected" is displayed as "Pending" everywhere — same wording the
// edit form uses — so the row badge and the form always agree.
const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  expected: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-800' },
  received: { label: 'Received', badge: 'bg-green-100 text-green-700' },
  clawback: { label: 'Clawback', badge: 'bg-red-100 text-red-700' },
}

const typeOf = (key: string) =>
  TYPE_CONFIG[key] ?? { label: key, badge: 'bg-gray-100 text-gray-600' }
const statusOf = (key: string) =>
  STATUS_CONFIG[key] ?? { label: key, badge: 'bg-gray-100 text-gray-600' }

const peso = (n: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(n)

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—'

const effectiveDate = (c: CommissionRow) => c.received_date ?? c.expected_date

const EMPTY_FORM = {
  commission_type: 'first_year',
  policy_id: '',
  rate: '',
  amount: '',
  expected_date: '',
  received_date: '',
  status: 'expected',
}

// ─────────────────────────────────────────────────────────────────────────────
// Action control — native <select> that shows "-" as its label
// ─────────────────────────────────────────────────────────────────────────────

function ActionSelect({
  row,
  onEdit,
  onMarkReceived,
  onDelete,
}: {
  row: CommissionRow
  onEdit: (r: CommissionRow) => void
  onMarkReceived: (r: CommissionRow) => void
  onDelete: (r: CommissionRow) => void
}) {
  // Controlled value always resets to '' after handling a choice, so the
  // placeholder option ("-") is what displays again immediately — it never
  // goes blank and never gets stuck on the last selection.
  const [value, setValue] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const choice = e.target.value
    if (choice === 'edit') onEdit(row)
    else if (choice === 'mark_received') onMarkReceived(row)
    else if (choice === 'delete') onDelete(row)
    setValue('')
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="h-9 w-full max-w-[8.5rem] rounded-lg border bg-white px-2 text-xs font-medium md:w-auto"
      aria-label="Row actions"
    >
      <option value="" disabled hidden>
        -
      </option>
      <option value="edit">Edit</option>
      {row.status !== 'received' && (
        <option value="mark_received">Mark received</option>
      )}
      <option value="delete">Delete</option>
    </select>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function CommissionsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [rows, setRows] = useState<CommissionRow[]>([])
  const [policies, setPolicies] = useState<PolicyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filters
  const [year, setYear] = useState<number>(2026)
  const [month, setMonth] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [type, setType] = useState<string>('all')
  const [clientId, setClientId] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client'>('date')

  // Add/Edit form — editingId === null means "add new"
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    const [commissionsRes, policiesRes] = await Promise.all([
      supabase
        .from('commissions')
        .select(
          `id, policy_id, commission_type, rate, amount, expected_date,
           received_date, status,
           policies ( policy_number, product_name,
             clients ( id, full_name ) )`
        )
        .order('expected_date', { ascending: false }),
      supabase
        .from('policies')
        .select('id, policy_number, product_name, clients ( id, full_name )')
        .order('policy_number'),
    ])

    if (commissionsRes.error) setErrorMsg(commissionsRes.error.message)
    setRows((commissionsRes.data as unknown as CommissionRow[]) ?? [])
    setPolicies((policiesRes.data as unknown as PolicyOption[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((r) => {
      const c = r.policies?.clients
      if (c) map.set(c.id, c.full_name)
    })
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = effectiveDate(r)
      if (!d) return false
      const dt = new Date(d)
      if (dt.getFullYear() !== year) return false
      if (month !== 'all' && dt.getMonth() !== Number(month)) return false
      if (status !== 'all' && r.status !== status) return false
      if (type !== 'all' && r.commission_type !== type) return false
      if (clientId !== 'all' && r.policies?.clients?.id !== clientId) return false
      return true
    })
  }, [rows, year, month, status, type, clientId])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === 'amount') arr.sort((a, b) => b.amount - a.amount)
    else if (sortBy === 'client')
      arr.sort((a, b) =>
        (a.policies?.clients?.full_name ?? 'zzz').localeCompare(
          b.policies?.clients?.full_name ?? 'zzz'
        )
      )
    else
      arr.sort(
        (a, b) =>
          new Date(effectiveDate(b) ?? 0).getTime() -
          new Date(effectiveDate(a) ?? 0).getTime()
      )
    return arr
  }, [filtered, sortBy])

  // YTD totals for the selected year. "Pending" here = status 'expected'.
  // Clawbacks are shown separately and subtracted from the year total,
  // since they represent money taken back, not earned.
  const ytd = useMemo(() => {
    const inYear = rows.filter((r) => {
      const d = effectiveDate(r)
      return d && new Date(d).getFullYear() === year
    })
    const received = inYear
      .filter((r) => r.status === 'received')
      .reduce((s, r) => s + r.amount, 0)
    const pending = inYear
      .filter((r) => r.status === 'expected')
      .reduce((s, r) => s + r.amount, 0)
    const clawback = inYear
      .filter((r) => r.status === 'clawback')
      .reduce((s, r) => s + r.amount, 0)
    return { received, pending, clawback, total: received + pending - clawback }
  }, [rows, year])

  // All-time received — every year combined, received only, minus clawbacks
  const allTimeReceived = useMemo(() => {
    const received = rows
      .filter((r) => r.status === 'received')
      .reduce((s, r) => s + r.amount, 0)
    const clawback = rows
      .filter((r) => r.status === 'clawback')
      .reduce((s, r) => s + r.amount, 0)
    return received - clawback
  }, [rows])

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(row: CommissionRow) {
    setEditingId(row.id)
    setForm({
      commission_type: row.commission_type,
      policy_id: row.policy_id ?? '',
      rate: row.rate != null ? String(row.rate) : '',
      amount: String(row.amount),
      expected_date: row.expected_date ?? '',
      received_date: row.received_date ?? '',
      status: row.status,
    })
    setShowForm(true)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)

    const isBonus = form.commission_type === 'bonus'
    const payload = {
      commission_type: form.commission_type,
      policy_id: isBonus ? null : form.policy_id || null,
      rate: form.rate ? Number(form.rate) : null,
      amount: Number(form.amount),
      expected_date: form.expected_date || null,
      received_date: form.received_date || null,
      status: form.status, // 'expected' | 'received' | 'clawback'
    }

    if (!isBonus && !payload.policy_id) {
      setErrorMsg('Please select a policy (or choose type: Bonus).')
      setSaving(false)
      return
    }
    if (!payload.amount || Number.isNaN(payload.amount)) {
      setErrorMsg('Please enter a valid amount.')
      setSaving(false)
      return
    }

    const { error } = editingId
      ? await supabase.from('commissions').update(payload).eq('id', editingId)
      : await supabase.from('commissions').insert(payload)

    if (error) {
      setErrorMsg(error.message)
    } else {
      closeForm()
      await load()
    }
    setSaving(false)
  }

  async function markReceived(row: CommissionRow) {
    const { error } = await supabase
      .from('commissions')
      .update({
        status: 'received',
        received_date: new Date().toISOString().slice(0, 10),
      })
      .eq('id', row.id)
    if (error) setErrorMsg(error.message)
    else await load()
  }

  async function handleDelete(row: CommissionRow) {
    if (!confirm('Delete this commission entry?')) return
    const { error } = await supabase.from('commissions').delete().eq('id', row.id)
    if (error) setErrorMsg(error.message)
    else await load()
  }

  const selectCls = 'h-11 rounded-lg border bg-white px-3 text-sm'
  const inputCls = 'h-11 w-full rounded-lg border px-3 text-sm'

  return (
    <div className="p-4 md:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Commissions</h1>
        <button
          onClick={() => (showForm ? closeForm() : openAdd())}
          className="h-11 whitespace-nowrap rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800"
        >
          {showForm ? 'Close' : '+ Add Commission'}
        </button>
      </div>

      {/* Totals — YTD for selected year + all-time received */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">YTD Commission · {year}</p>
          <p className="text-3xl font-bold tabular-nums">{peso(ytd.total)}</p>
          <p className="mt-1 text-xs text-gray-500">
            <span className="font-medium text-green-700">{peso(ytd.received)}</span>{' '}
            received ·{' '}
            <span className="font-medium text-yellow-700">{peso(ytd.pending)}</span>{' '}
            pending
            {ytd.clawback > 0 && (
              <>
                {' '}
                ·{' '}
                <span className="font-medium text-red-700">
                  -{peso(ytd.clawback)}
                </span>{' '}
                clawback
              </>
            )}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">All-Time Received · all years</p>
          <p className="text-3xl font-bold tabular-nums text-green-700">
            {peso(allTimeReceived)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Net of clawbacks, {YEARS[0]}–present
          </p>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-2"
        >
          <p className="text-sm font-semibold md:col-span-2">
            {editingId ? 'Edit commission' : 'Add commission'}
          </p>

          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Type</span>
            <select
              value={form.commission_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, commission_type: e.target.value }))
              }
              className={`${selectCls} w-full`}
            >
              <option value="first_year">First Year</option>
              <option value="renewal">Renewal</option>
              <option value="bonus">Bonus (not tied to a policy)</option>
            </select>
          </label>

          {form.commission_type !== 'bonus' && (
            <label className="text-sm">
              <span className="mb-1 block text-gray-600">Policy</span>
              <select
                value={form.policy_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, policy_id: e.target.value }))
                }
                className={`${selectCls} w-full`}
              >
                <option value="">Select policy…</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.policy_number ?? 'No number'} — {p.product_name ?? ''}
                    {p.clients ? ` (${p.clients.full_name})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Amount (₱)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className={inputCls}
              required
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Rate % (optional)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
              className={inputCls}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Pending date</span>
            <input
              type="date"
              value={form.expected_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, expected_date: e.target.value }))
              }
              className={inputCls}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Received date</span>
            <input
              type="date"
              value={form.received_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, received_date: e.target.value }))
              }
              className={inputCls}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className={`${selectCls} w-full`}
            >
              <option value="expected">Pending</option>
              <option value="received">Received</option>
              <option value="clawback">Clawback</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="h-11 flex-1 rounded-lg bg-red-700 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update commission' : 'Save commission'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="h-11 rounded-lg border px-4 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {errorMsg && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectCls}>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectCls}>
          <option value="all">All months</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="all">All statuses</option>
          <option value="expected">Pending</option>
          <option value="received">Received</option>
          <option value="clawback">Clawback</option>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
          <option value="all">All types</option>
          <option value="first_year">First Year</option>
          <option value="renewal">Renewal</option>
          <option value="bonus">Bonus</option>
        </select>

        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={selectCls}>
          <option value="all">All clients</option>
          {clientOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className={selectCls}
        >
          <option value="date">Sort: Newest first</option>
          <option value="amount">Sort: Amount (high → low)</option>
          <option value="client">Sort: Client (A → Z)</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border bg-white py-10 text-center text-sm text-gray-500">
          No commissions match these filters. Add one with “+ Add Commission”.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden rounded-2xl border bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Client / Source</th>
                  <th className="px-4 py-3">Policy</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium">
                      {r.policies?.clients?.full_name ??
                        (r.commission_type === 'bonus' ? 'Company bonus' : '—')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.policies
                        ? `${r.policies.policy_number ?? ''} ${r.policies.product_name ?? ''}`.trim() || '—'
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${BADGE_BASE} ${typeOf(r.commission_type).badge}`}>
                        {typeOf(r.commission_type).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {peso(r.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtDate(r.expected_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtDate(r.received_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`${BADGE_BASE} ${statusOf(r.status).badge}`}>
                        {statusOf(r.status).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionSelect
                        row={r}
                        onEdit={openEdit}
                        onMarkReceived={markReceived}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="space-y-3 md:hidden">
            {sorted.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {r.policies?.clients?.full_name ??
                        (r.commission_type === 'bonus' ? 'Company bonus' : '—')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.policies
                        ? `${r.policies.policy_number ?? ''} ${r.policies.product_name ?? ''}`.trim()
                        : 'No policy'}
                    </p>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{peso(r.amount)}</p>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`${BADGE_BASE} ${typeOf(r.commission_type).badge}`}>
                    {typeOf(r.commission_type).label}
                  </span>
                  <span className={`${BADGE_BASE} ${statusOf(r.status).badge}`}>
                    {statusOf(r.status).label}
                  </span>
                  <div className="ml-auto">
                    <ActionSelect
                      row={r}
                      onEdit={openEdit}
                      onMarkReceived={markReceived}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>

                <p className="mt-2 whitespace-nowrap text-xs text-gray-500">
                  Pending {fmtDate(r.expected_date)} · Received {fmtDate(r.received_date)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
