# Email Template Development Guide

**Last Updated:** October 14, 2025  
**Purpose:** Guide for implementing email notification templates based on website styles and data structures

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Data Source](#data-source)
3. [Data Structures](#data-structures)
4. [Website Component Styles](#website-component-styles)
5. [Email Template Requirements](#email-template-requirements)
6. [Example Implementations](#example-implementations)
7. [Testing & Validation](#testing--validation)

---

## 🎯 Overview

Email notifications pull data from `public/data/last-updates.json` which is regenerated after each content pipeline run. The email templates should mirror the visual style of our website components for consistency.

**Key Components to Style:**
- **Publication Cards** - Daily briefing summaries
- **Article Cards** - Individual article listings
- **Article Update Cards** - Update notifications for existing articles
- **Severity Badges** - Visual indicators for threat levels
- **Category Pills** - Article categorization tags
- **CVE Badges** - Security vulnerability identifiers

---

## 📂 Data Source

**File:** `public/data/last-updates.json`  
**Location:** `/Users/admin/cybernetsec-io/public/data/last-updates.json`  
**Update Frequency:** After every pipeline run (daily)  
**Format:** JSON

### File Structure Overview

```json
{
  "lastUpdated": "ISO 8601 timestamp",
  "runDate": "YYYY-MM-DD",
  "publications": [/* Array of publication objects */],
  "articles": {
    "updated": [/* Array of article update objects */]
  },
  "pages": {
    "updated": []
  }
}
```

---

## 📊 Data Structures

### 1. Publication Object

**Used for:** Publication subscriber emails (full daily briefing)

```typescript
interface PublicationInEmail {
  slug: string;                    // "daily-cybersecurity-briefing-2025-10-09"
  type: string;                    // "publication-daily" | "publication-weekly" | "publication-monthly"
  headline: string;                // Main publication title
  articleCount: number;            // Total number of articles in publication
  articles: ArticleInPublication[] // Array of articles (see below)
}
```

**Example:**
```json
{
  "slug": "daily-cybersecurity-briefing-2025-10-09",
  "type": "publication-daily",
  "headline": "Ransomware Alliance Forms, Critical Zero-Days Plague Oracle & Zimbra",
  "articleCount": 9,
  "articles": [
    {/* Article objects - see ArticleInPublication below */}
  ]
}
```

**URL Construction:**
```
https://cyber.netsecops.io/publications/{slug}
Example: https://cyber.netsecops.io/publications/daily-cybersecurity-briefing-2025-10-09
```

---

### 2. ArticleInPublication Object

**Used for:** Individual articles within publication emails

```typescript
interface ArticleInPublication {
  slug: string;                // Article URL slug
  headline: string;            // Article title
  summary: string;             // Full article summary (2-3 paragraphs)
  categories: string[];        // ["Vulnerability", "Ransomware", "Data Breach"]
  tags: string[];              // ["zero-day", "rce", "extortion", "oracle"]
  cves?: string[];             // ["CVE-2025-61882"] (optional)
  malware?: string[];          // ["LockBit 5.0"] (optional)
  severity: string;            // "critical" | "high" | "medium" | "low" | "informational"
  isUpdate: boolean;           // true if this is an update to existing article
  publishedAt: string;         // ISO 8601 timestamp (original publish date)
  updatedAt?: string;          // ISO 8601 timestamp (only if isUpdate = true)
}
```

**Example:**
```json
{
  "slug": "oracle-zero-day-exploited-by-cl0p-in-extortion-campaign",
  "headline": "Oracle Zero-Day Exploited by Cl0p in Massive Extortion Campaign",
  "summary": "A critical zero-day remote code execution (RCE) vulnerability in Oracle's E-Business Suite...",
  "categories": ["Vulnerability", "Ransomware", "Data Breach"],
  "tags": ["zero-day", "rce", "extortion", "oracle", "enterprise software", "cisa kev"],
  "cves": ["CVE-2025-61882"],
  "severity": "critical",
  "isUpdate": true,
  "publishedAt": "2025-10-07T04:55:00.000Z",
  "updatedAt": "2025-10-14T06:14:12.579Z"
}
```

**URL Construction:**
```
https://cyber.netsecops.io/articles/{slug}
Example: https://cyber.netsecops.io/articles/oracle-zero-day-exploited-by-cl0p-in-extortion-campaign
```

---

### 3. ArticleUpdate Object

**Used for:** Article subscriber update notifications (brief update summaries)

```typescript
interface ArticleUpdate {
  slug: string;                // Article URL slug
  originalHeadline: string;    // Original article title
  updateTitle: string;         // Short update title (1 line)
  updateSummary: string;       // Brief update description (2-3 sentences)
  categories: string[];        // Article categories
  tags: string[];              // Article tags
  cves?: string[];             // Related CVEs (optional)
  malware?: string[];          // Related malware (optional)
  severity: string;            // Threat severity level
  publishedAt: string;         // Original publish date
  updatedAt: string;           // Update timestamp
}
```

**Example:**
```json
{
  "slug": "oracle-zero-day-exploited-by-cl0p-in-extortion-campaign",
  "originalHeadline": "Oracle Zero-Day Exploited by Cl0p in Massive Extortion Campaign",
  "updateTitle": "Cl0p Oracle EBS attack: Phishing escalation & timeline revealed",
  "updateSummary": "New details reveal that the Cl0p campaign exploiting CVE-2025-61882 began in August 2025...",
  "categories": ["Vulnerability", "Ransomware", "Data Breach"],
  "tags": ["zero-day", "rce", "extortion", "oracle"],
  "cves": ["CVE-2025-61882"],
  "severity": "critical",
  "publishedAt": "2025-10-07T04:55:00.000Z",
  "updatedAt": "2025-10-14T06:14:12.579Z"
}
```

---

## 🎨 Website Component Styles

### Component Location References

**Website Components:**
- Article Cards: `/components/CyberCard.vue`
- Badge Components: `/components/CyberBadge.vue`
- Button Components: `/components/CyberButton.vue`
- Layout: `/layouts/cyber.vue`

**Styling:**
- Tailwind Config: `/tailwind.config.js`
- Main CSS: `/assets/css/main.css`

---

### 1. Severity Badge Styles

**Purpose:** Visual indicator for threat severity levels

**Severity Levels & Colors:**

| Severity | Background | Text | Border | Icon |
|----------|-----------|------|--------|------|
| critical | `bg-red-500/10` | `text-red-400` | `border-red-500/20` | 🔴 |
| high | `bg-orange-500/10` | `text-orange-400` | `border-orange-500/20` | 🟠 |
| medium | `bg-yellow-500/10` | `text-yellow-400` | `border-yellow-500/20` | 🟡 |
| low | `bg-blue-500/10` | `text-blue-400` | `border-blue-500/20` | 🔵 |
| informational | `bg-gray-500/10` | `text-gray-400` | `border-gray-500/20` | ℹ️ |

**HTML/CSS Example (Website):**
```html
<!-- Critical Severity Badge -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
  <span class="mr-1">🔴</span>
  Critical
</span>

<!-- High Severity Badge -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
  <span class="mr-1">🟠</span>
  High
</span>
```

**Email-Safe CSS (Inline Styles):**
```html
<!-- Critical -->
<span style="display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2);">
  🔴 Critical
</span>

<!-- High -->
<span style="display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: rgba(249, 115, 22, 0.1); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.2);">
  🟠 High
</span>
```

---

### 2. Category Pills

**Purpose:** Article categorization tags

**Category Colors:**

| Category | Background | Text |
|----------|-----------|------|
| Vulnerability | `bg-purple-500/10` | `text-purple-400` |
| Ransomware | `bg-red-500/10` | `text-red-400` |
| Data Breach | `bg-pink-500/10` | `text-pink-400` |
| Threat Actor | `bg-orange-500/10` | `text-orange-400` |
| Malware | `bg-rose-500/10` | `text-rose-400` |
| Supply Chain Attack | `bg-yellow-500/10` | `text-yellow-400` |
| Cloud Security | `bg-sky-500/10` | `text-sky-400` |
| Phishing | `bg-amber-500/10` | `text-amber-400` |
| Cyberattack | `bg-red-600/10` | `text-red-500` |
| Industrial Control Systems | `bg-indigo-500/10` | `text-indigo-400` |
| Other | `bg-gray-500/10` | `text-gray-400` |

**HTML Example (Website):**
```html
<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
  Vulnerability
</span>
```

**Email-Safe CSS:**
```html
<span style="display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: rgba(168, 85, 247, 0.1); color: #c084fc; margin-right: 4px;">
  Vulnerability
</span>
```

---

### 3. CVE Badge

**Purpose:** Display CVE identifiers

**Style:**
- Background: `bg-cyan-500/10`
- Text: `text-cyan-400`
- Border: `border-cyan-500/20`
- Font: Monospace

**HTML Example (Website):**
```html
<span class="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
  CVE-2025-61882
</span>
```

**Email-Safe CSS:**
```html
<span style="display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace; background-color: rgba(6, 182, 212, 0.1); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.2); margin-right: 4px;">
  CVE-2025-61882
</span>
```

---

### 4. Article Card Layout

**Purpose:** Display article summary in list format

**Card Structure:**
```html
<div class="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-cyan-500/50 transition-colors">
  <!-- Severity Badge + Categories -->
  <div class="flex items-center gap-2 mb-3">
    <span class="severity-badge">🔴 Critical</span>
    <span class="category-pill">Vulnerability</span>
    <span class="category-pill">Ransomware</span>
  </div>
  
  <!-- Headline -->
  <h3 class="text-xl font-bold text-white mb-3">
    <a href="/articles/slug">Article Headline</a>
  </h3>
  
  <!-- Summary -->
  <p class="text-gray-300 mb-4 leading-relaxed">
    Article summary text...
  </p>
  
  <!-- CVEs + Tags -->
  <div class="flex flex-wrap gap-2 mb-4">
    <span class="cve-badge">CVE-2025-61882</span>
    <span class="tag-badge">zero-day</span>
    <span class="tag-badge">extortion</span>
  </div>
  
  <!-- Footer (Date, Read More) -->
  <div class="flex items-center justify-between text-sm">
    <span class="text-gray-500">Updated Oct 14, 2025</span>
    <a href="/articles/slug" class="text-cyan-400 hover:text-cyan-300">
      Read Full Article →
    </a>
  </div>
</div>
```

**Email-Safe Version:**
```html
<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background-color: rgba(17, 24, 39, 0.5); border: 1px solid #1f2937; border-radius: 8px; margin-bottom: 16px;">
  <tr>
    <td style="padding: 24px;">
      
      <!-- Severity + Categories -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
        <tr>
          <td style="padding-right: 8px;">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2);">
              🔴 Critical
            </span>
          </td>
          <td style="padding-right: 8px;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: rgba(168, 85, 247, 0.1); color: #c084fc;">
              Vulnerability
            </span>
          </td>
        </tr>
      </table>
      
      <!-- Headline -->
      <h3 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; line-height: 1.4;">
        <a href="https://cyber.netsecops.io/articles/oracle-zero-day-exploited-by-cl0p-in-extortion-campaign" style="color: #ffffff; text-decoration: none;">
          Oracle Zero-Day Exploited by Cl0p in Massive Extortion Campaign
        </a>
      </h3>
      
      <!-- Summary -->
      <p style="font-size: 14px; color: #d1d5db; margin: 0 0 16px 0; line-height: 1.6;">
        A critical zero-day remote code execution (RCE) vulnerability in Oracle's E-Business Suite...
      </p>
      
      <!-- CVEs -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          <td style="padding-right: 8px; padding-bottom: 4px;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace; background-color: rgba(6, 182, 212, 0.1); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.2);">
              CVE-2025-61882
            </span>
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        <tr>
          <td style="font-size: 13px; color: #6b7280;">
            Updated Oct 14, 2025
          </td>
          <td style="text-align: right;">
            <a href="https://cyber.netsecops.io/articles/oracle-zero-day-exploited-by-cl0p-in-extortion-campaign" style="font-size: 13px; color: #22d3ee; text-decoration: none;">
              Read Full Article →
            </a>
          </td>
        </tr>
      </table>
      
    </td>
  </tr>
</table>
```

---

### 5. Publication Card Layout

**Purpose:** Display daily briefing summary

**Card Structure:**
```html
<div class="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-6 mb-6">
  <!-- Type Badge -->
  <div class="mb-3">
    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
      📰 Daily Briefing
    </span>
  </div>
  
  <!-- Headline -->
  <h2 class="text-2xl font-bold text-white mb-4">
    <a href="/publications/slug">Publication Headline</a>
  </h2>
  
  <!-- Stats -->
  <div class="flex items-center gap-4 text-sm text-gray-400 mb-4">
    <span>📅 October 9, 2025</span>
    <span>📊 9 Articles</span>
    <span>🆕 7 New</span>
    <span>🔄 2 Updated</span>
  </div>
  
  <!-- Read More -->
  <a href="/publications/slug" class="inline-flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors">
    View Full Briefing →
  </a>
</div>
```

---

### 6. Update Indicator

**Purpose:** Show when article has been updated

**Icon + Text:**
```html
<div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
  <span class="text-blue-400">🔄</span>
  <span class="text-xs font-medium text-blue-400">Updated</span>
</div>
```

**Email-Safe:**
```html
<span style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 9999px;">
  <span style="color: #60a5fa;">🔄</span>
  <span style="font-size: 12px; font-weight: 500; color: #60a5fa;">Updated</span>
</span>
```

---

## 📧 Email Template Requirements

### 1. Publication Subscriber Email

**Trigger:** New daily/weekly/monthly publication generated  
**Audience:** Users subscribed to publications  
**Data Source:** `last-updates.json → publications[0]`

**Email Structure:**

```
┌─────────────────────────────────────┐
│ Header: Logo + Unsubscribe          │
├─────────────────────────────────────┤
│ Publication Card                     │
│  - Badge: Daily/Weekly/Monthly       │
│  - Headline                          │
│  - Stats (article count, etc)        │
│  - CTA: View Full Briefing           │
├─────────────────────────────────────┤
│ Article Cards (loop through articles)│
│  For each article:                   │
│  - Severity Badge                    │
│  - Categories (up to 3)              │
│  - Headline (linked)                 │
│  - Summary (first 200 chars + ...)   │
│  - CVEs (if any)                     │
│  - Update indicator (if isUpdate)    │
│  - CTA: Read More                    │
├─────────────────────────────────────┤
│ Footer: Links + Preferences          │
└─────────────────────────────────────┘
```

**Content Rules:**
- Show ALL articles from `publications[0].articles`
- Limit summary to ~200 characters with "..." truncation
- Show max 3 categories per article
- Show max 3 CVEs per article (if more, add "+X more")
- Highlight updated articles with update indicator

---

### 2. Article Subscriber Email

**Trigger:** Existing articles updated  
**Audience:** Users subscribed to article updates  
**Data Source:** `last-updates.json → articles.updated`

**Email Structure:**

```
┌─────────────────────────────────────┐
│ Header: Logo + Unsubscribe          │
├─────────────────────────────────────┤
│ Title: "X Articles Updated Today"   │
├─────────────────────────────────────┤
│ Update Cards (loop through updates)  │
│  For each update:                    │
│  - Update Badge + Date               │
│  - Original Headline                 │
│  - Update Title (bold)               │
│  - Update Summary                    │
│  - Severity Badge                    │
│  - CVEs (if any)                     │
│  - CTA: Read Full Update             │
├─────────────────────────────────────┤
│ Footer: Links + Preferences          │
└─────────────────────────────────────┘
```

**Content Rules:**
- Only show articles with `isUpdate: true`
- Use `updateTitle` and `updateSummary` (not full article)
- Keep update summaries concise (2-3 sentences)
- Link to full article for details

---

### 3. Combined Email (Optional)

**For users subscribed to both publications AND article updates**

Structure: Publication section + divider + Updates section

---

## 💡 Example Implementations

### Example 1: Publication Email (HTML)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Cybersecurity Briefing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Container -->
  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 640px; margin: 0 auto; background-color: #1e293b; padding: 32px;">
    
    <!-- Header -->
    <tr>
      <td style="text-align: center; padding-bottom: 32px;">
        <h1 style="color: #22d3ee; font-size: 28px; margin: 0;">🔐 CyberNet Sec</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 8px 0 0 0;">Daily Cybersecurity Intelligence</p>
      </td>
    </tr>
    
    <!-- Publication Card -->
    <tr>
      <td style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.1)); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        
        <!-- Badge -->
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: rgba(6, 182, 212, 0.2); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.3); margin-bottom: 12px;">
          📰 Daily Briefing
        </span>
        
        <!-- Headline -->
        <h2 style="font-size: 24px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3;">
          Ransomware Alliance Forms, Critical Zero-Days Plague Oracle & Zimbra
        </h2>
        
        <!-- Stats -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
          <tr>
            <td style="padding-right: 16px; font-size: 13px; color: #94a3b8;">📅 October 9, 2025</td>
            <td style="padding-right: 16px; font-size: 13px; color: #94a3b8;">📊 9 Articles</td>
            <td style="font-size: 13px; color: #94a3b8;">🆕 7 New • 🔄 2 Updated</td>
          </tr>
        </table>
        
        <!-- CTA -->
        <a href="https://cyber.netsecops.io/publications/daily-cybersecurity-briefing-2025-10-09" style="display: inline-block; padding: 12px 24px; background-color: #06b6d4; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          View Full Briefing →
        </a>
        
      </td>
    </tr>
    
    <!-- Article Section Title -->
    <tr>
      <td style="padding: 24px 0 16px 0;">
        <h3 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0;">Today's Top Stories</h3>
      </td>
    </tr>
    
    <!-- Article Card 1 -->
    <tr>
      <td style="background-color: rgba(17, 24, 39, 0.5); border: 1px solid #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
        
        <!-- Severity + Categories -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
          <tr>
            <td style="padding-right: 8px;">
              <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2);">
                🔴 Critical
              </span>
            </td>
            <td style="padding-right: 8px;">
              <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: rgba(168, 85, 247, 0.1); color: #c084fc;">
                Vulnerability
              </span>
            </td>
            <td>
              <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: rgba(239, 68, 68, 0.1); color: #f87171;">
                Ransomware
              </span>
            </td>
          </tr>
        </table>
        
        <!-- Update Indicator -->
        <span style="display: inline-flex; align-items: center; padding: 4px 12px; background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 9999px; margin-bottom: 12px;">
          <span style="color: #60a5fa; margin-right: 6px;">🔄</span>
          <span style="font-size: 12px; font-weight: 500; color: #60a5fa;">Updated Today</span>
        </span>
        
        <!-- Headline -->
        <h4 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; line-height: 1.4;">
          <a href="https://cyber.netsecops.io/articles/oracle-zero-day-exploited-by-cl0p-in-extortion-campaign" style="color: #ffffff; text-decoration: none;">
            Oracle Zero-Day Exploited by Cl0p in Massive Extortion Campaign
          </a>
        </h4>
        
        <!-- Summary -->
        <p style="font-size: 14px; color: #d1d5db; margin: 0 0 16px 0; line-height: 1.6;">
          A critical zero-day remote code execution (RCE) vulnerability in Oracle's E-Business Suite, tracked as CVE-2025-61882, is being actively exploited...
        </p>
        
        <!-- CVEs -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
          <tr>
            <td style="padding-right: 8px;">
              <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace; background-color: rgba(6, 182, 212, 0.1); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.2);">
                CVE-2025-61882
              </span>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          <tr>
            <td style="font-size: 13px; color: #6b7280;">
              Published Oct 7 • Updated Oct 14
            </td>
            <td style="text-align: right;">
              <a href="https://cyber.netsecops.io/articles/oracle-zero-day-exploited-by-cl0p-in-extortion-campaign" style="font-size: 13px; color: #22d3ee; text-decoration: none; font-weight: 500;">
                Read Full Article →
              </a>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
    
    <!-- Repeat Article Cards... -->
    
    <!-- Footer -->
    <tr>
      <td style="text-align: center; padding-top: 32px; border-top: 1px solid #1f2937;">
        <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px 0;">
          © 2025 CyberNet Sec • <a href="https://cyber.netsecops.io" style="color: #22d3ee; text-decoration: none;">Visit Website</a>
        </p>
        <p style="font-size: 12px; color: #4b5563; margin: 0;">
          <a href="#" style="color: #6b7280; text-decoration: none;">Unsubscribe</a> • 
          <a href="#" style="color: #6b7280; text-decoration: none;">Manage Preferences</a>
        </p>
      </td>
    </tr>
    
  </table>
  
</body>
</html>
```

---

### Example 2: Parsing last-updates.json (JavaScript)

```javascript
// Load the data
const data = require('./public/data/last-updates.json');

// Parse Publication Data
const publication = data.publications[0]; // Most recent publication
console.log('Publication:', {
  slug: publication.slug,
  headline: publication.headline,
  articleCount: publication.articleCount,
  type: publication.type
});

// Loop through articles in publication
publication.articles.forEach(article => {
  console.log('\nArticle:', {
    slug: article.slug,
    headline: article.headline,
    severity: article.severity,
    isUpdate: article.isUpdate,
    categories: article.categories,
    cves: article.cves || [],
    url: `https://cyber.netsecops.io/articles/${article.slug}`
  });
});

// Parse Article Updates
const updates = data.articles.updated;
console.log(`\n${updates.length} article(s) updated`);

updates.forEach(update => {
  console.log('\nUpdate:', {
    slug: update.slug,
    originalHeadline: update.originalHeadline,
    updateTitle: update.updateTitle,
    updateSummary: update.updateSummary,
    severity: update.severity,
    url: `https://cyber.netsecops.io/articles/${update.slug}`
  });
});
```

---

### Example 3: Severity Badge Generator (Function)

```javascript
function getSeverityBadge(severity) {
  const config = {
    critical: {
      emoji: '🔴',
      bg: 'rgba(239, 68, 68, 0.1)',
      text: '#f87171',
      border: 'rgba(239, 68, 68, 0.2)'
    },
    high: {
      emoji: '🟠',
      bg: 'rgba(249, 115, 22, 0.1)',
      text: '#fb923c',
      border: 'rgba(249, 115, 22, 0.2)'
    },
    medium: {
      emoji: '🟡',
      bg: 'rgba(234, 179, 8, 0.1)',
      text: '#facc15',
      border: 'rgba(234, 179, 8, 0.2)'
    },
    low: {
      emoji: '🔵',
      bg: 'rgba(59, 130, 246, 0.1)',
      text: '#60a5fa',
      border: 'rgba(59, 130, 246, 0.2)'
    },
    informational: {
      emoji: 'ℹ️',
      bg: 'rgba(107, 114, 128, 0.1)',
      text: '#9ca3af',
      border: 'rgba(107, 114, 128, 0.2)'
    }
  };
  
  const c = config[severity] || config.informational;
  const label = severity.charAt(0).toUpperCase() + severity.slice(1);
  
  return `
    <span style="display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: ${c.bg}; color: ${c.text}; border: 1px solid ${c.border};">
      ${c.emoji} ${label}
    </span>
  `;
}

// Usage
console.log(getSeverityBadge('critical'));
console.log(getSeverityBadge('high'));
```

---

## ✅ Testing & Validation

### 1. Data Validation Checklist

- [ ] `last-updates.json` file exists and is valid JSON
- [ ] `publications` array has at least 1 item
- [ ] All required fields present (slug, headline, articles, etc)
- [ ] Article slugs are valid (no spaces, lowercase, hyphens)
- [ ] URLs construct correctly with slugs
- [ ] CVE format matches `CVE-YYYY-NNNNN`
- [ ] Severity values are valid enum: `critical|high|medium|low|informational`
- [ ] Timestamps are valid ISO 8601 format

### 2. Email Client Testing

**Test in these clients:**
- [ ] Gmail (web)
- [ ] Gmail (mobile app - iOS/Android)
- [ ] Outlook (web)
- [ ] Outlook (desktop app)
- [ ] Apple Mail (macOS/iOS)
- [ ] Yahoo Mail
- [ ] Proton Mail

**Check for:**
- Correct rendering of colors/styles
- Responsive design (mobile vs desktop)
- Links work correctly
- Images/emojis display
- No layout breaks

### 3. Link Testing

**Test all link types:**
```
Publication links:
https://cyber.netsecops.io/publications/{slug}

Article links:
https://cyber.netsecops.io/articles/{slug}

Unsubscribe link:
https://cyber.netsecops.io/unsubscribe?email={email}&token={token}
```

### 4. Sample Test Data

Create test emails with:
- 1 article (minimum case)
- 10 articles (typical case)
- 20+ articles (maximum case)
- Articles with many CVEs (5+)
- Articles with long summaries
- Articles with all severity levels
- Mix of new and updated articles

---

## 📚 Additional Resources

**Website URLs:**
- Live Site: https://cyber.netsecops.io
- API Endpoint (future): https://cyber.netsecops.io/api/last-updates

**Code References:**
- Vue Components: `/components/`
- Type Definitions: `/types/`
- Tailwind Config: `/tailwind.config.js`

**Contact:**
- Repository: https://github.com/jaybodecode/netsecops.dev
- Issues: Create GitHub issue for questions

---

## 🔄 Changelog

**v1.0 - October 14, 2025**
- Initial documentation
- Publication and article subscriber templates
- Complete style guide with email-safe CSS
- Code examples and test checklist

---

**Last Updated:** October 14, 2025  
**Maintained By:** CyberNet Sec Development Team  
**Version:** 1.0
