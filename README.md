# CyberNetSec.io - LLM Quick Reference Guide

> **Purpose:** Essential information for LLMs working on this Nuxt 4 cybersecurity platform. Source of truth is in the code - this is just the helper.

---

## 🤖 Working with LLMs

### DO
✅ Use VS Code tasks for dev server management  
✅ Use `run_task` tool instead of terminal commands for dev server/linting
✅ Test both SSR and client-side navigation  
✅ Provide unique `key` to `useFetch` calls  
✅ **Commit completed features** when confirmed working

### DON'T
❌ Run `npm run dev` directly (use "Run Dev Server" task)  
❌ Kill/start server processes without asking user  
❌ Make deployment decisions without authorization  
❌ Create detailed summaries unless requested

### 🚨 CRITICAL RULE
**When user says STOP:** STOP ALL ACTIONS immediately and answer their question. Wait for confirmation to continue.

---

## ⚡ Essential Commands

### VS Code Tasks (Primary Method)
```bash
# Use run_task tool with these task IDs:
"Run Dev Server"           # Start dev server (port 3000)
"Stop Dev Server"          # Kill port 3000 processes  
"Restart Dev Server"       # Stop + start dev server
"Start All Watch Services" # TypeScript + ESLint Clean watching (RECOMMENDED)
"TypeScript Watch"         # Type checking only
"ESLint Clean Watch"       # 🆕 Clean linting (clears output each run)
"ESLint Watch"             # Traditional linting + auto-fix
"Run All Checks"          # One-time lint + type check
```

### Package Scripts (Secondary)
```bash
npm run dev          # DON'T use directly - use task instead
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run type-check   # TypeScript check
npm run build        # Production build
npm run generate     # Static site generation
```

### Deployment (GitHub Pages)
```bash
# 1. Generate static site
npm run generate

# 2. Deploy to GitHub Pages (interactive)
./scripts/deploy-to-pages.sh

# For details, see: scripts/deploy-to-pages.md
```

### Task Monitoring & Error Checking
```bash
# Check running task output (RECOMMENDED method):
get_task_output(id="shell: ESLint Clean Watch", workspaceFolder="/Users/admin/cybernetsec-io")
get_task_output(id="shell: TypeScript Watch", workspaceFolder="/Users/admin/cybernetsec-io")
get_task_output(id="Run Dev Server", workspaceFolder="/Users/admin/cybernetsec-io")

# Check terminal output:  
get_terminal_output(id="terminal_id")

# 🎯 CRITICAL: To check TypeScript/ESLint errors during development:
# Use get_task_output with "shell: ESLint Clean Watch" - this shows live 
# linting results from the already running watch task without starting new processes
```

## 🏗️ Architecture (Quick Reference)

**Framework:** Nuxt 4.1.3 + Vue 3 + Tailwind CSS  
**Data:** JSON files in `public/data/` + PostgreSQL for entity relationships  
**Deployment:** GitHub Pages (static only)

> **⚠️ ARCHITECTURE UPDATE:** Content generation pipeline being redesigned with unified AI generation and entity-relationship database. See `ARCHITECTURE-DECISIONS.md` for details.

### Key Paths
```
pages/                    # Routes
components/Cyber*.vue     # UI components  
composables/use*.ts       # Data fetching
public/data/*.json        # Content data
.vscode/tasks.json        # Task definitions
eslint.config.js          # Linting rules
```

### Critical Technical Details
- **SSR vs Client:** Different `baseURL` needed for `useFetch`
- **Static Files:** Use `public/` not `assets/` for JSON
- **Client Storage:** localStorage for read tracking, filters
- **Type Safety:** TypeScript + ESLint watch services available

---

## � Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Run "Stop Dev Server" task |
| Changes not showing | Hard refresh or restart dev server |
| Linting errors | Run "ESLint Watch" task for auto-fix |
| Type errors | Run "TypeScript Watch" task |
| File corrupted | User will restore manually, then continue |

---

## � File Impact Matrix

| File Changed | Action Required |
|--------------|-----------------|
| `nuxt.config.ts` | Restart dev server |
| `tailwind.config.js` | Restart dev server |
| `.vue` files | Hot reload (automatic) |
| `public/data/*.json` | Hard refresh browser |
| `.vscode/tasks.json` | Reload VS Code window |
