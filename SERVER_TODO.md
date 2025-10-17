# Server-Side Tasks & Manual Updates TODO

> **⚠️ ARCHITECTURE UPDATE:** New unified content generation pipeline with entity-relationship database is being implemented. See `ARCHITECTURE-DECISIONS.md` for details.

## SANS Internet Storm Center - Threat Level Updates

### Manual Update Process (Current Implementation)

**File Location:** `/public/data/threat-level.json`

**Update Frequency:** Daily or when threat level changes

**API Endpoint to Check:** 
- JSON: `https://isc.sans.edu/api/infocon?json`
- XML: `https://isc.sans.edu/api/infocon`
- Web Page: `https://isc.sans.edu/infocon.html`

**Quick Update Command:**
```bash
# Check current threat level
curl -s "https://isc.sans.edu/api/infocon?json"

# Returns: {"status":"green"} (or yellow, orange, red)
```

### Update Steps:

1. **Check SANS ISC API:**
   ```bash
   curl -s "https://isc.sans.edu/api/infocon?json"
   ```

2. **Update the JSON file** at `/public/data/threat-level.json`:
   - Update `level` field (green/yellow/orange/red)
   - Update `levelName` field (Low/Guarded/Elevated/Severe)
   - Update `description` if needed
   - Update `lastUpdated` to current date (YYYY-MM-DD)
   - Update `lastChecked` to current timestamp (ISO 8601 format)

3. **Commit and push** changes to trigger rebuild/redeploy

### SANS API Usage Requirements:

✅ **Required:**
- Custom User-Agent header with contact email
- Proper attribution to SANS ISC on website
- Link back to https://isc.sans.edu/

⚠️ **Restrictions:**
- Don't resell the data
- Don't build business-critical apps on it (best-effort basis)
- Respect rate limits (wait 5 minutes if you get 429 error)
- Consider contributing data by running a honeypot

📜 **License:** Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
- Link: https://creativecommons.org/licenses/by-nc-sa/4.0/

### Example User-Agent for API Calls:

```bash
curl -H "User-Agent: YourSiteName/1.0 (your-email@example.com)" \
  "https://isc.sans.edu/api/infocon?json"
```

### Automation Options (Future):

#### Option A: GitHub Actions (Recommended)
Create a scheduled workflow that:
1. Runs daily at a specific time
2. Fetches threat level from SANS API
3. Updates the JSON file if changed
4. Commits and triggers rebuild

**Example workflow:** `.github/workflows/update-threat-level.yml`

```yaml
name: Update SANS Threat Level
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Fetch Threat Level
        run: |
          LEVEL=$(curl -s -H "User-Agent: Social-Poster/1.0 (your-email@example.com)" \
            "https://isc.sans.edu/api/infocon?json" | jq -r '.status')
          # Update JSON file logic here
      - name: Commit changes
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add public/data/threat-level.json
          git diff --staged --quiet || git commit -m "Update threat level to $LEVEL"
          git push
```

#### Option B: Nuxt Server API Route (Build-Time)
Add server API route that fetches during build:
- File: `server/api/threat-level.ts`
- Fetches from SANS during SSG build
- Bakes data into static site

#### Option C: External Cron Job
Set up a server cron job that:
1. Fetches SANS API data
2. Updates GitHub repo via API
3. Triggers rebuild webhook

---

## Other Manual Update Tasks

### Article & Publication Updates
- Location: `/public/data/articles/` and `/public/data/publications/`
- Update frequency: As needed when new content is created
- Index files: `articles-index.json`, `publications-index.json`

### Site Configuration
- Location: `/public/data/site-config.json`
- Update frequency: As needed for site-wide changes

---

## Contact Information for APIs

**SANS ISC Contact:**
- Email: jullrich@sans.edu (for API issues)
- Support: handlers@isc.sans.edu
- Website: https://isc.sans.edu/

**Your Contact (to include in User-Agent):**
- TODO: Add your email address for API User-Agent headers

---

## Notes

- SANS API is provided "as-is" on a best-effort basis
- No strict rate limits, but be respectful
- May get 429 errors during high load (wait 5 minutes)
- Currently no authentication required (may change in future)
- Data is updated daily by SANS
