# How to run & update this project

A plain-language guide for running the app locally and pulling in new changes.

---

## 🖥️ Localhost vs. the dev server (read this first)

Two separate things:

| Thing | What it is | Survives a browser restart? |
|---|---|---|
| **The dev server** | `npm run dev` running in your **VS Code terminal** | ✅ Yes — it runs in the terminal, not the browser |
| **`http://localhost:3000`** | Just a *window* into the dev server | ✅ Yes, **as long as the server is still running** |

- Closing/restarting your **browser** does **not** affect the server. Just reopen the browser and go to `http://localhost:3000`.
- The localhost link only works **while `npm run dev` is running.** It stops working if you:
  - close the VS Code terminal, or
  - press `Ctrl + C` in that terminal, or
  - restart / shut down your Mac.

### What to do first each time you sit down to work
1. Open VS Code in the `trialcode` folder.
2. Look at the terminal — is `npm run dev` still running? (You'll see `✓ Ready` and `Local: http://localhost:3000`.)
   - **Yes** → just open `localhost:3000`. Done.
   - **No** (empty terminal, or you restarted the Mac) → run:
     ```bash
     npm run dev
     ```
3. Leave that terminal open while you work. Need another terminal? Open a **second** one (the `+` in the terminal panel) so you don't kill the server.

> You only need `rm -rf .next` before `npm run dev` when something looks stale or broken — not every time.

---

## 🔒 "Locking in" changes — the git commands

All changes live on GitHub (branch `claude/date-format-action-menu-evq7rt`). "Locking in" on your machine means pulling.

**Every time a change is pushed:**
```bash
git pull
```
Downloads and applies everything at once. The dev server auto-reloads — no restart needed.

**Check your branch / that you're up to date:**
```bash
git status
```
Look for `On branch claude/date-format-action-menu-evq7rt` and `Your branch is up to date`.

**See the latest changes that landed:**
```bash
git log --oneline -5
```

**If `git pull` refuses because of local edits:**
```bash
git stash        # set your edits aside
git pull         # get the new changes
git stash drop   # discard the set-aside edits (already included in the pushed commits)
```

**One-time-only things (don't repeat):**
- The Supabase `reminder_status` SQL migration — run once, ever (see below).
- `npm install` — only after a new dependency is added.

---

## ⚠️ Errors to watch for

| What you see | Cause | Fix |
|---|---|---|
| "This site can't be reached" / connection refused | Dev server isn't running | `npm run dev` |
| `Expected ';', '}' or <eof>` / Syntax Error | A file got half-edited | `git pull` to restore the clean version |
| `Module not found: Can't resolve …` | Missing dependency / bad import | `npm install`, then restart dev |
| `The default export is not a React Component` | A page lost its `export default` | `git pull` |
| Renewals: error when setting a reminder | DB column missing | Run the `reminder_status` SQL in Supabase (below) |
| Changes don't show up | Stale cache or you didn't pull | `git pull`, then `rm -rf .next && npm run dev` |
| Terminal: `EADDRINUSE :3000` | A server is already on that port | Open `localhost:3000`; or `Ctrl+C` the old one first |

**Rule of thumb:** red text in the **browser** = code/build issue → `git pull` + restart. Page **won't load at all** = server not running → `npm run dev`.

---

## 🗄️ One-time Supabase migration (renewals reminder)

The renewal reminder dropdown saves to a column that must exist in the database.
Run this once in **Supabase → SQL Editor**:

```sql
alter table public.policies
  add column if not exists reminder_status text
    check (reminder_status in ('to_contact', 'contacting_done', 'policy_review'));
```

---

## ✅ Your normal routine

1. **Sit down** → open VS Code → is `npm run dev` running? If not, run it.
2. **A change was pushed** → run `git pull` (server auto-reloads).
3. **Something looks stale/red** → `git pull`, then `rm -rf .next && npm run dev`.
4. **Browser closed?** → just reopen `localhost:3000`.
