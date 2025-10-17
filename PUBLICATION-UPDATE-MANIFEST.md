# RSS Feed System Design

**Purpose:** Complete RSS feed generation system with multiple feeds (all publications, updated articles, category-specific) and a user-facing subscription page.

**Status:** 📋 APPROVED - Ready for implementation

---

## 🎯 Core Requirements

### Must Support:
1. ✅ **Publications Feed** - Latest 5 publications (daily/weekly/monthly/special)
2. ✅ **Updated Articles Feed** - Last 10 updated articles only
3. ✅ **Category-Specific Feeds** - Individual RSS feeds per category (Ransomware, Vulnerability, etc.)
4. ✅ **RSS Subscription Page** - User-facing page explaining feeds with copy-paste URLs
5. ✅ **Auto-Generation** - Generated after each pipeline run
6. ✅ **Standards Compliant** - RSS 2.0 specification

---

## � RSS Feed Structure

### Generated RSS Files

```
public/
├── rss/
│   ├── all.xml                      # Latest 5 publications (any type)
│   ├── updates.xml                  # Last 10 updated articles
│   ├── categories/
│   │   ├── ransomware.xml           # Ransomware category
│   │   ├── vulnerability.xml        # Vulnerability category
│   │   ├── data-breach.xml          # Data Breach category
│   │   ├── threat-actor.xml         # Threat Actor category
│   │   ├── malware.xml              # Malware category
│   │   └── ...                      # Other categories dynamically
│   └── metadata.json                # Feed metadata (for subscription page)
```

### Feed Descriptions

| Feed | URL | Contents | Updates |
|------|-----|----------|---------|
| **All Publications** | `/rss/all.xml` | Latest 5 publications (daily/weekly/monthly/special) | After each pipeline run |
| **Updated Articles** | `/rss/updates.xml` | Last 10 articles that were updated (not newly created) | Only when articles are updated |
| **Category Feeds** | `/rss/categories/{category}.xml` | Latest 20 articles in specific category | After each pipeline run |

---

## 📊 RSS Feed XML Schema

### 1. Publications Feed (`/rss/all.xml`)

**RSS 2.0 XML Structure:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CybernetSec - Latest Publications</title>
    <link>https://cybernetsec.io</link>
    <description>Latest cybersecurity threat intelligence publications including daily digests, weekly roundups, and special reports.</description>
    <language>en-us</language>
    <lastBuildDate>Sun, 13 Oct 2025 06:00:00 GMT</lastBuildDate>
    <atom:link href="https://cybernetsec.io/rss/all.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://cybernetsec.io/images/logo-rss.png</url>
      <title>CybernetSec</title>
      <link>https://cybernetsec.io</link>
    </image>
    
    <!-- Publication Item 1 -->
    <item>
      <title>Daily Cybersecurity Briefing - October 13, 2025</title>
      <link>https://cybernetsec.io/publications/daily-2025-10-13</link>
      <description><![CDATA[
        <p>Today's briefing covers 5 critical security incidents including new CL0P ransomware campaign, 
        zero-day vulnerabilities in enterprise software, and APT activity targeting critical infrastructure.</p>
        <p><strong>Highlights:</strong></p>
        <ul>
          <li>CL0P exploits Oracle E-Business Suite zero-day</li>
          <li>Chinese APT targets network appliances</li>
          <li>Major healthcare ransomware incident</li>
        </ul>
      ]]></description>
      <pubDate>Sun, 13 Oct 2025 06:00:00 GMT</pubDate>
      <guid isPermaLink="true">https://cybernetsec.io/publications/daily-2025-10-13</guid>
      <category>Daily Digest</category>
      <category>Ransomware</category>
      <category>Vulnerability</category>
      <enclosure url="https://cybernetsec.io/images/publications/daily-2025-10-13.webp" 
                 type="image/webp" length="0"/>
    </item>
    
    <!-- Publication Item 2 -->
    <item>
      <title>Daily Cybersecurity Briefing - October 12, 2025</title>
      <link>https://cybernetsec.io/publications/daily-2025-10-12</link>
      <description><![CDATA[
        <p>Yesterday's top security news covering data breaches, vulnerability disclosures, and threat actor activity.</p>
      ]]></description>
      <pubDate>Sat, 12 Oct 2025 06:00:00 GMT</pubDate>
      <guid isPermaLink="true">https://cybernetsec.io/publications/daily-2025-10-12</guid>
      <category>Daily Digest</category>
    </item>
    
    <!-- ... up to 5 most recent publications ... -->
    
  </channel>
</rss>
```

---

### 2. Updated Articles Feed (`/rss/updates.xml`)

**RSS 2.0 XML Structure:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CybernetSec - Article Updates</title>
    <link>https://cybernetsec.io</link>
    <description>Recently updated cybersecurity threat intelligence articles with new information, IOCs, or developments.</description>
    <language>en-us</language>
    <lastBuildDate>Sun, 13 Oct 2025 06:00:00 GMT</lastBuildDate>
    <atom:link href="https://cybernetsec.io/rss/updates.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://cybernetsec.io/images/logo-rss.png</url>
      <title>CybernetSec</title>
      <link>https://cybernetsec.io</link>
    </image>
    
    <!-- Updated Article Item 1 -->
    <item>
      <title>[UPDATE] CL0P's Oracle EBS Exploitation: New IOCs and Mitigation Details</title>
      <link>https://cybernetsec.io/articles/clop-oracle-ebs-zero-day-cve-2025-61882</link>
      <description><![CDATA[
        <p><strong>Update:</strong> New intelligence reveals additional command-and-control infrastructure 
        and indicators of compromise in CL0P's ongoing Oracle E-Business Suite exploitation campaign.</p>
        <p><strong>What's New:</strong></p>
        <ul>
          <li>12 new C2 server IP addresses identified</li>
          <li>Additional file hashes for detection</li>
          <li>Network segmentation recommendations</li>
          <li>Updated YARA rules</li>
        </ul>
        <p><strong>CVEs:</strong> CVE-2025-61882 (CVSS 9.8)</p>
        <p><strong>Updated:</strong> October 13, 2025 at 6:00 AM UTC</p>
      ]]></description>
      <pubDate>Sun, 13 Oct 2025 06:00:00 GMT</pubDate>
      <guid isPermaLink="false">article:clop-oracle-ebs:update:2</guid>
      <category>Ransomware</category>
      <category>Vulnerability</category>
      <category>UPDATE</category>
      <enclosure url="https://cybernetsec.io/images/articles/clop-oracle-campaign.webp" 
                 type="image/webp" length="0"/>
    </item>
    
    <!-- Updated Article Item 2 -->
    <item>
      <title>[UPDATE] LockBit-Qilin-DragonForce Alliance Expands to Southeast Asia</title>
      <link>https://cybernetsec.io/articles/lockbit-qilin-dragonforce-ransomware-alliance</link>
      <description><![CDATA[
        <p><strong>Update:</strong> The ransomware alliance has expanded operations to target 
        organizations in Vietnam, Thailand, and Malaysia.</p>
        <p><strong>What's New:</strong></p>
        <ul>
          <li>Geographic expansion to Southeast Asia</li>
          <li>New victim organizations identified</li>
          <li>Regional targeting patterns</li>
        </ul>
        <p><strong>Updated:</strong> October 13, 2025 at 6:00 AM UTC</p>
      ]]></description>
      <pubDate>Sun, 13 Oct 2025 06:00:00 GMT</pubDate>
      <guid isPermaLink="false">article:lockbit-alliance:update:1</guid>
      <category>Ransomware</category>
      <category>Threat Actor</category>
      <category>UPDATE</category>
    </item>
    
    <!-- ... up to 10 most recently updated articles ... -->
    
  </channel>
</rss>
```

**Note:** This feed is ONLY generated/updated when articles are actually updated. If no updates occurred, file timestamp stays the same.

---

### 3. Category-Specific Feeds (`/rss/categories/{category}.xml`)

**Example: Ransomware Feed (`/rss/categories/ransomware.xml`)**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CybernetSec - Ransomware</title>
    <link>https://cybernetsec.io</link>
    <description>Latest ransomware threat intelligence including attack campaigns, new variants, IOCs, and mitigation strategies.</description>
    <language>en-us</language>
    <lastBuildDate>Sun, 13 Oct 2025 06:00:00 GMT</lastBuildDate>
    <atom:link href="https://cybernetsec.io/rss/categories/ransomware.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://cybernetsec.io/images/categories/ransomware.png</url>
      <title>CybernetSec - Ransomware</title>
      <link>https://cybernetsec.io</link>
    </image>
    
    <!-- Article items with Ransomware category - latest 20 -->
    
    <item>
      <title>CL0P Exploits Oracle E-Business Suite Zero-Day in Mass Extortion Campaign</title>
      <link>https://cybernetsec.io/articles/clop-oracle-ebs-zero-day-cve-2025-61882</link>
      <description><![CDATA[
        <p>The threat actor group CL0P is exploiting a critical zero-day vulnerability (CVE-2025-61882) 
        in Oracle E-Business Suite for widespread data extortion.</p>
        <p><strong>Severity:</strong> Critical (CVSS 9.8)</p>
        <p><strong>CVEs:</strong> CVE-2025-61882</p>
        <p><strong>Threat Actors:</strong> CL0P, FIN11</p>
      ]]></description>
      <pubDate>Sun, 13 Oct 2025 06:00:00 GMT</pubDate>
      <guid isPermaLink="true">https://cybernetsec.io/articles/clop-oracle-ebs-zero-day-cve-2025-61882</guid>
      <category>Ransomware</category>
      <category>Vulnerability</category>
      <enclosure url="https://cybernetsec.io/images/articles/clop-oracle-campaign.webp" 
                 type="image/webp" length="0"/>
    </item>
    
    <!-- ... up to 20 articles with this category ... -->
    
  </channel>
</rss>
```

**Categories to Generate:**
- Ransomware
- Vulnerability
- Data Breach
- Threat Actor
- Malware
- APT
- Zero Day
- Phishing
- Supply Chain
- Cloud Security
- IoT Security
- Mobile Security
- (Any other categories found in database)

---

## 📋 Feed Metadata JSON

### `/rss/metadata.json`

**Purpose:** Provides information for the RSS subscription page

```json
    {
      "pub_id": "daily-2025-10-09",
      "pub_type": "daily",
      "slug": "daily-cybersecurity-briefing-2025-10-09",
      "title": "Daily Cybersecurity Briefing - October 9, 2025",
      "headline": "CL0P Oracle EBS Updates, LockBit Alliance Expands, SonicWall Breach Details",
      "description": "Three major updates including new IOCs for CL0P's Oracle exploitation campaign, expanded targeting by the LockBit-Qilin-DragonForce alliance, and additional breach details from SonicWall's security incident.",
      "url": "https://cybernetsec.io/publications/daily-2025-10-09",
      "permalink": "https://cybernetsec.io/publications/daily-2025-10-09",
      "published_at": "2025-10-09T06:00:00.000Z",
      "updated_at": "2025-10-09T06:00:00.000Z",
      
      "rss_metadata": {
        "guid": "pub:daily-2025-10-09",
        "author": "cybernetsec.io",
        "categories": ["Ransomware", "Vulnerability", "Data Breach"],
        "enclosure": {
          "url": "https://cybernetsec.io/images/publications/daily-2025-10-09.webp",
          "type": "image/webp"
        }
      },
      
      "email_metadata": {
        "subject": "🚨 Daily Cyber Briefing: CL0P Updates, LockBit Alliance Expands",
        "preview_text": "3 critical updates including new CL0P IOCs, LockBit alliance expansion...",
        "send_priority": "high"
      },
      
      "article_count": 3,
      "articles": [
        {
          "article_id": "article-2025-10-05-001",
          "slug": "clop-oracle-ebs-zero-day-cve-2025-61882",
          "is_new": false,
          "is_update": true,
          "update_reason": "New IOCs discovered, additional C2 infrastructure identified",
          "title": "CL0P's Oracle EBS Exploitation: New IOCs and Mitigation Details",
          "headline": "CL0P Ransomware Expands Oracle EBS Campaign with New Infrastructure",
          "severity": "critical",
          "excerpt": "Updated intelligence reveals additional command-and-control infrastructure and indicators of compromise in CL0P's ongoing Oracle E-Business Suite exploitation campaign...",
          "categories": ["Ransomware", "Vulnerability"],
          "tags": ["CL0P", "Oracle", "CVE-2025-61882", "IOC", "RCE"],
          "url": "https://cybernetsec.io/articles/clop-oracle-ebs-zero-day-cve-2025-61882",
          "permalink": "https://cybernetsec.io/articles/clop-oracle-ebs-zero-day-cve-2025-61882",
          "published_at": "2025-10-05T10:30:00.000Z",
          "updated_at": "2025-10-09T06:00:00.000Z",
          "reading_time_minutes": 5,
          
          "rss_metadata": {
            "guid": "article:article-2025-10-05-001:update:2",
            "author": "cybernetsec.io",
            "categories": ["Ransomware", "Vulnerability"],
            "enclosure": {
              "url": "https://cybernetsec.io/images/articles/clop-oracle-ebs-campaign.webp",
              "type": "image/webp"
            }
          },
          
          "email_metadata": {
            "subject": "🔥 UPDATE: CL0P Oracle Campaign - New IOCs Released",
            "preview_text": "New command-and-control infrastructure discovered...",
            "send_priority": "high",
            "subscription_triggers": [
              "article_update:article-2025-10-05-001",
              "category:Ransomware",
              "tag:CL0P",
              "severity:critical"
            ]
          },
          
          "cves": ["CVE-2025-61882"],
          "cvss_score": 9.8,
          "entities": {
            "threat_actors": ["CL0P", "FIN11"],
            "companies": ["Oracle"],
            "products": ["E-Business Suite"],
            "malware": ["CL0P Ransomware"]
          }
        },
        {
          "article_id": "article-2025-10-09-001",
          "slug": "lockbit-qilin-dragonforce-ransomware-alliance",
          "is_new": false,
          "is_update": true,
          "update_reason": "Alliance expands geographic targeting to Southeast Asia",
          "title": "LockBit-Qilin-DragonForce Alliance Expands to Southeast Asia",
          "headline": "Ransomware Alliance Broadens Attack Surface with Regional Expansion",
          "severity": "high",
          "excerpt": "The collaborative ransomware alliance between LockBit, Qilin, and DragonForce has expanded operations to target organizations in Vietnam, Thailand, and Malaysia...",
          "categories": ["Ransomware", "Threat Actor"],
          "tags": ["LockBit", "Qilin", "DragonForce", "Alliance", "Southeast Asia"],
          "url": "https://cybernetsec.io/articles/lockbit-qilin-dragonforce-ransomware-alliance",
          "permalink": "https://cybernetsec.io/articles/lockbit-qilin-dragonforce-ransomware-alliance",
          "published_at": "2025-10-07T14:20:00.000Z",
          "updated_at": "2025-10-09T06:00:00.000Z",
          "reading_time_minutes": 4,
          
          "rss_metadata": {
            "guid": "article:article-2025-10-09-001:update:1",
            "author": "cybernetsec.io",
            "categories": ["Ransomware", "Threat Actor"],
            "enclosure": {
              "url": "https://cybernetsec.io/images/articles/ransomware-alliance.webp",
              "type": "image/webp"
            }
          },
          
          "email_metadata": {
            "subject": "⚠️ UPDATE: Ransomware Alliance Expands to Southeast Asia",
            "preview_text": "LockBit alliance now targeting Vietnam, Thailand, Malaysia...",
            "send_priority": "medium",
            "subscription_triggers": [
              "article_update:article-2025-10-09-001",
              "category:Ransomware",
              "tag:LockBit",
              "region:Southeast Asia"
            ]
          },
          
          "cves": [],
          "entities": {
            "threat_actors": ["LockBit", "Qilin", "DragonForce"],
            "malware": ["LockBit Ransomware", "Qilin Ransomware"]
          }
        },
        {
          "article_id": "article-2025-10-09-002",
          "slug": "sonicwall-breach-exposed-cloud-backup-configs",
          "is_new": false,
          "is_update": true,
          "update_reason": "Additional details on exfiltrated data types revealed",
          "title": "SonicWall Breach: Cloud Backup Configurations and Credentials Exposed",
          "headline": "SonicWall Confirms Scope of Data Exfiltration in Security Incident",
          "severity": "high",
          "excerpt": "SonicWall has confirmed additional details about its recent security breach, revealing that attackers exfiltrated cloud backup configurations, firewall policies, and customer credentials...",
          "categories": ["Data Breach", "Vendor"],
          "tags": ["SonicWall", "Data Breach", "Cloud Security", "Credentials"],
          "url": "https://cybernetsec.io/articles/sonicwall-breach-exposed-cloud-backup-configs",
          "permalink": "https://cybernetsec.io/articles/sonicwall-breach-exposed-cloud-backup-configs",
          "published_at": "2025-10-06T09:15:00.000Z",
          "updated_at": "2025-10-09T06:00:00.000Z",
          "reading_time_minutes": 4,
          
          "rss_metadata": {
            "guid": "article:article-2025-10-09-002:update:1",
            "author": "cybernetsec.io",
            "categories": ["Data Breach", "Vendor"],
            "enclosure": {
              "url": "https://cybernetsec.io/images/articles/sonicwall-breach.webp",
              "type": "image/webp"
            }
          },
          
          "email_metadata": {
            "subject": "⚠️ UPDATE: SonicWall Breach - Credentials & Configs Exposed",
            "preview_text": "Company confirms exfiltration of backup configs and customer credentials...",
            "send_priority": "medium",
            "subscription_triggers": [
              "article_update:article-2025-10-09-002",
              "category:Data Breach",
              "tag:SonicWall",
              "tag:Cloud Security"
            ]
          },
          
          "cves": [],
          "entities": {
            "companies": ["SonicWall"],
            "products": ["SonicWall Firewalls"]
          }
        }
      ]
    }
  ],
  
  "pages_updated": [],
  
  "subscription_filters": {
    "by_severity": {
      "critical": 1,
      "high": 2,
      "medium": 0,
      "low": 0
    },
    "by_category": {
      "Ransomware": 2,
      "Vulnerability": 1,
      "Data Breach": 1,
      "Threat Actor": 1,
      "Vendor": 1
    },
    "by_publication_type": {
      "daily": 1,
      "weekly": 0,
      "monthly": 0,
      "special": 0
    },
    "by_entity_type": {
      "threat_actors": ["CL0P", "FIN11", "LockBit", "Qilin", "DragonForce"],
      "companies": ["Oracle", "SonicWall"],
      "products": ["E-Business Suite", "SonicWall Firewalls"],
      "malware": ["CL0P Ransomware", "LockBit Ransomware", "Qilin Ransomware"],
      "cves": ["CVE-2025-61882"]
    }
  },
  
  "pipeline_metadata": {
    "steps_completed": ["3", "4", "5", "6", "7"],
    "duration_seconds": 14.8,
    "llm_calls": 3,
    "articles_processed": 3,
    "articles_saved": 3,
    "articles_skipped": 0,
    "errors": []
  }
}
```

---

```json
{
  "generated_at": "2025-10-13T06:00:00.000Z",
  "feeds": {
    "all": {
      "title": "All Publications",
      "description": "Latest 5 publications including daily digests, weekly roundups, and special reports",
      "url": "/rss/all.xml",
      "full_url": "https://cybernetsec.io/rss/all.xml",
      "item_count": 5,
      "last_updated": "2025-10-13T06:00:00.000Z",
      "update_frequency": "Daily"
    },
    "updates": {
      "title": "Article Updates",
      "description": "Recently updated articles with new information, IOCs, or developments (last 10)",
      "url": "/rss/updates.xml",
      "full_url": "https://cybernetsec.io/rss/updates.xml",
      "item_count": 10,
      "last_updated": "2025-10-13T06:00:00.000Z",
      "update_frequency": "As articles are updated"
    },
    "categories": [
      {
        "slug": "ransomware",
        "title": "Ransomware",
        "description": "Ransomware threat intelligence including attack campaigns, new variants, and IOCs",
        "url": "/rss/categories/ransomware.xml",
        "full_url": "https://cybernetsec.io/rss/categories/ransomware.xml",
        "item_count": 20,
        "article_count": 45,
        "last_updated": "2025-10-13T06:00:00.000Z",
        "icon": "🔒"
      },
      {
        "slug": "vulnerability",
        "title": "Vulnerability",
        "description": "Zero-day vulnerabilities, CVE disclosures, and security advisories",
        "url": "/rss/categories/vulnerability.xml",
        "full_url": "https://cybernetsec.io/rss/categories/vulnerability.xml",
        "item_count": 20,
        "article_count": 38,
        "last_updated": "2025-10-13T06:00:00.000Z",
        "icon": "🔓"
      },
      {
        "slug": "data-breach",
        "title": "Data Breach",
        "description": "Data breach incidents, exposed databases, and leaked credentials",
        "url": "/rss/categories/data-breach.xml",
        "full_url": "https://cybernetsec.io/rss/categories/data-breach.xml",
        "item_count": 20,
        "article_count": 29,
        "last_updated": "2025-10-13T06:00:00.000Z",
        "icon": "💾"
      },
      {
        "slug": "threat-actor",
        "title": "Threat Actor",
        "description": "APT groups, cybercriminal organizations, and threat actor activity",
        "url": "/rss/categories/threat-actor.xml",
        "full_url": "https://cybernetsec.io/rss/categories/threat-actor.xml",
        "item_count": 20,
        "article_count": 32,
        "last_updated": "2025-10-13T06:00:00.000Z",
        "icon": "👤"
      }
      // ... more categories dynamically generated
    ]
  },
  "statistics": {
    "total_feeds": 12,
    "total_articles": 156,
    "total_publications": 8,
    "categories_count": 10,
    "last_pipeline_run": "2025-10-13T06:00:00.000Z"
  }
}
```

---

## 🎨 RSS Subscription Page

### New Page: `/pages/rss.vue`

**Purpose:** User-facing page explaining RSS feeds with copy-paste URLs

**Design Concept:**

### 2. Summary Statistics

```typescript
interface ManifestSummary {
  total_publications: number         // Number of publications generated
  total_new_articles: number         // Count of NEW articles
  total_updated_articles: number     // Count of UPDATED articles
  total_pages_updated: number        // Count of pages modified
  highest_severity: Severity         // Highest severity level present
  primary_categories: string[]       // Top 3-5 categories
}
```

### 3. Publication Entry

```typescript
interface Publication {
  // Core Identity
  pub_id: string                     // daily-2025-10-09
  pub_type: PublicationType         // daily | weekly | monthly | special
  slug: string                       // URL-friendly identifier
  
  // Content
  title: string                      // Full title
  headline: string                   // Short headline
  description: string                // Publication summary (200-300 chars)
  
  // URLs
  url: string                        // Relative URL
  permalink: string                  // Absolute URL
  
  // Timestamps
  published_at: string               // ISO 8601
  updated_at: string                 // ISO 8601
  
  // RSS Feed Specific
  rss_metadata: RSSMetadata
  
  // Email Specific
  email_metadata: EmailMetadata
  
  // Article References
  article_count: number
  articles: ArticleEntry[]           // Detailed article info
}
```

### 4. Article Entry (within Publication)

```typescript
interface ArticleEntry {
  // Core Identity
  article_id: string                 // article-2025-10-05-001
  slug: string                       // URL-friendly identifier
  
  // Status Flags
  is_new: boolean                    // True if newly created
  is_update: boolean                 // True if existing article updated
  update_reason?: string             // Why article was updated
  
  // Content
  title: string                      // Full title
  headline: string                   // Short headline
  excerpt: string                    // Brief excerpt (150-200 chars)
  severity: Severity                 // critical | high | medium | low
  
  // Classification
  categories: string[]               // Primary categories
  tags: string[]                     // Detailed tags
  
  // URLs
  url: string                        // Relative URL
  permalink: string                  // Absolute URL
  
  // Timestamps
  published_at: string               // ISO 8601 (original publish)
  updated_at: string                 // ISO 8601 (last update)
  reading_time_minutes: number
  
  // RSS Feed Specific
  rss_metadata: RSSMetadata
  
  // Email Specific
  email_metadata: EmailMetadata
  
  // Cybersecurity Specific
  cves: string[]                     // CVE IDs
  cvss_score?: number                // CVSS score if applicable
  entities: EntityGroup              // Structured entities
}
```

### 5. RSS Metadata

```typescript
interface RSSMetadata {
  guid: string                       // Globally unique identifier
  author: string                     // Author/organization
  categories: string[]               // RSS categories
  enclosure?: {                      // Featured image
    url: string
    type: string                     // MIME type
  }
}
```

**RSS GUID Format:**
- Publications: `pub:{pub_id}`
- New Articles: `article:{article_id}`
- Updated Articles: `article:{article_id}:update:{count}`

### 6. Email Metadata

```typescript
interface EmailMetadata {
  subject: string                    // Email subject line
  preview_text: string               // Preview pane text (100-150 chars)
  send_priority: 'high' | 'medium' | 'low'
  subscription_triggers?: string[]   // What subscriptions this matches
}
```

**Subscription Trigger Format:**
```typescript
[
  "article_update:article-2025-10-05-001",  // Specific article
  "category:Ransomware",                    // Category subscription
  "tag:CL0P",                               // Tag subscription
  "severity:critical",                      // Severity threshold
  "region:Southeast Asia",                  // Geographic region
  "entity:threat_actor:LockBit"            // Specific entity
]
```

### 7. Page Update (for static pages)

```typescript
interface PageUpdate {
  page_id: string                    // disclaimer, about, contact
  slug: string                       // URL-friendly identifier
  title: string                      // Page title
  url: string                        // Relative URL
  permalink: string                  // Absolute URL
  updated_at: string                 // ISO 8601
  update_reason: string              // Why page was updated
  
  rss_metadata: RSSMetadata
  email_metadata: EmailMetadata
}
```

**Example:**
```json
{
  "page_id": "disclaimer",
  "slug": "disclaimer",
  "title": "Legal Disclaimer",
  "url": "/disclaimer",
  "permalink": "https://cybernetsec.io/disclaimer",
  "updated_at": "2025-10-13T06:00:00.000Z",
  "update_reason": "Updated privacy policy section for GDPR compliance",
  
  "rss_metadata": {
    "guid": "page:disclaimer:update:3",
    "author": "cybernetsec.io",
    "categories": ["Site Updates"]
  },
  
  "email_metadata": {
    "subject": "📄 Page Update: Legal Disclaimer",
    "preview_text": "Privacy policy section updated for GDPR compliance...",
    "send_priority": "low",
    "subscription_triggers": ["page_update:disclaimer"]
  }
}
```

### 8. Subscription Filters

```typescript
interface SubscriptionFilters {
  by_severity: {
    [key in Severity]: number        // Count per severity
  }
  by_category: {
    [category: string]: number       // Count per category
  }
  by_publication_type: {
    [type in PublicationType]: number
  }
  by_entity_type: {
    threat_actors: string[]
    companies: string[]
    products: string[]
    malware: string[]
    cves: string[]
  }
}
```

---

```vue
<template>
  <div class="rss-subscription-page">
    <CyberHeader>
      <h1>📡 Free RSS Feed Subscriptions</h1>
      <p>Stay updated with cybersecurity threat intelligence</p>
    </CyberHeader>

    <section class="what-is-rss">
      <h2>What is RSS?</h2>
      <p>
        RSS (Really Simple Syndication) allows you to receive automatic updates 
        whenever new content is published. Use an RSS reader like Feedly, Inoreader, 
        or NetNewsWire to subscribe to our feeds.
      </p>
    </section>

    <section class="main-feeds">
      <h2>Main Feeds</h2>
      
      <div class="feed-card">
        <div class="feed-header">
          <h3>📰 All Publications</h3>
          <CyberBadge>Daily</CyberBadge>
        </div>
        <p>Latest 5 publications including daily digests, weekly roundups, and special reports</p>
        <div class="feed-url">
          <input 
            type="text" 
            readonly 
            :value="baseUrl + '/rss/all.xml'"
            @click="copyToClipboard($event)"
          />
          <CyberButton @click="copyFeedUrl('/rss/all.xml')">Copy</CyberButton>
        </div>
        <div class="feed-stats">
          <span>{{ feeds.all.item_count }} items</span>
          <span>Last updated: {{ formatDate(feeds.all.last_updated) }}</span>
        </div>
      </div>

      <div class="feed-card">
        <div class="feed-header">
          <h3>🔄 Article Updates</h3>
          <CyberBadge variant="warning">Updated</CyberBadge>
        </div>
        <p>Recently updated articles with new information, IOCs, or developments (last 10)</p>
        <div class="feed-url">
          <input 
            type="text" 
            readonly 
            :value="baseUrl + '/rss/updates.xml'"
            @click="copyToClipboard($event)"
          />
          <CyberButton @click="copyFeedUrl('/rss/updates.xml')">Copy</CyberButton>
        </div>
        <div class="feed-stats">
          <span>{{ feeds.updates.item_count }} items</span>
          <span>Updated: {{ feeds.updates.update_frequency }}</span>
        </div>
      </div>
    </section>

    <section class="category-feeds">
      <h2>Category-Specific Feeds</h2>
      <p>Subscribe to specific threat categories relevant to your interests</p>
      
      <div class="category-grid">
        <div 
          v-for="category in feeds.categories" 
          :key="category.slug"
          class="category-card"
        >
          <div class="category-header">
            <span class="category-icon">{{ category.icon }}</span>
            <h3>{{ category.title }}</h3>
          </div>
          <p>{{ category.description }}</p>
          <div class="feed-url">
            <input 
              type="text" 
              readonly 
              :value="baseUrl + category.url"
              @click="copyToClipboard($event)"
            />
            <CyberButton @click="copyFeedUrl(category.url)">Copy</CyberButton>
          </div>
          <div class="feed-stats">
            <span>{{ category.article_count }} articles</span>
            <span>{{ category.item_count }} in feed</span>
          </div>
        </div>
      </div>
    </section>

    <section class="how-to-use">
      <h2>How to Subscribe</h2>
      <div class="steps">
        <div class="step">
          <span class="step-number">1</span>
          <div>
            <h3>Choose an RSS Reader</h3>
            <ul>
              <li><a href="https://feedly.com" target="_blank">Feedly</a> (Web, iOS, Android)</li>
              <li><a href="https://www.inoreader.com" target="_blank">Inoreader</a> (Web, iOS, Android)</li>
              <li><a href="https://netnewswire.com" target="_blank">NetNewsWire</a> (macOS, iOS)</li>
              <li><a href="https://reederapp.com" target="_blank">Reeder</a> (macOS, iOS)</li>
            </ul>
          </div>
        </div>
        
        <div class="step">
          <span class="step-number">2</span>
          <div>
            <h3>Copy Feed URL</h3>
            <p>Click the "Copy" button next to any feed above to copy its URL</p>
          </div>
        </div>
        
        <div class="step">
          <span class="step-number">3</span>
          <div>
            <h3>Add to Your Reader</h3>
            <p>Paste the URL into your RSS reader's "Add Feed" or "Subscribe" function</p>
          </div>
        </div>
        
        <div class="step">
          <span class="step-number">4</span>
          <div>
            <h3>Stay Updated</h3>
            <p>Your reader will automatically check for new content and notify you of updates</p>
          </div>
        </div>
      </div>
    </section>

    <section class="faq">
      <h2>Frequently Asked Questions</h2>
      
      <details>
        <summary>How often are feeds updated?</summary>
        <p>
          - <strong>All Publications:</strong> Updated daily after each content generation run (typically 6 AM UTC)<br>
          - <strong>Article Updates:</strong> Updated whenever articles receive new information<br>
          - <strong>Category Feeds:</strong> Updated daily with the latest articles in each category
        </p>
      </details>
      
      <details>
        <summary>Can I subscribe to multiple feeds?</summary>
        <p>
          Yes! You can subscribe to as many feeds as you like. We recommend subscribing to 
          "All Publications" for complete coverage, plus any specific category feeds that match 
          your interests.
        </p>
      </details>
      
      <details>
        <summary>What's the difference between publications and articles?</summary>
        <p>
          <strong>Publications</strong> are curated collections (like daily digests or weekly roundups) 
          that group multiple related articles. <strong>Articles</strong> are individual threat intelligence 
          reports. The "All Publications" feed shows our curated collections, while category feeds show 
          individual articles.
        </p>
      </details>
      
      <details>
        <summary>How do I know when an article is updated?</summary>
        <p>
          Subscribe to the "Article Updates" feed. When we add new information to an existing article 
          (like new IOCs, additional victims, or mitigation details), it will appear in this feed with 
          an [UPDATE] prefix and details about what changed.
        </p>
      </details>
    </section>
  </div>
</template>

<script setup lang="ts">
const baseUrl = 'https://cybernetsec.io'

// Load feed metadata
const { data: feeds } = await useFetch('/rss/metadata.json')

const copyFeedUrl = (url: string) => {
  const fullUrl = baseUrl + url
  navigator.clipboard.writeText(fullUrl)
  // Show toast notification
  alert('Feed URL copied to clipboard!')
}

const copyToClipboard = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.select()
  navigator.clipboard.writeText(input.value)
  alert('Feed URL copied to clipboard!')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.rss-subscription-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.feed-card, .category-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.feed-header, .category-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.category-icon {
  font-size: 2rem;
}

.feed-url {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.feed-url input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: monospace;
  background: var(--input-bg);
  cursor: pointer;
}

.feed-stats {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.step {
  display: flex;
  gap: 1rem;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-color);
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

details {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

summary {
  cursor: pointer;
  font-weight: 600;
  user-select: none;
}

details[open] summary {
  margin-bottom: 0.5rem;
}
</style>
```

---

## 🛠️ Implementation Scripts

### Script: `generate-rss-feeds.ts`

**Location:** `scripts/content-generation/cli/generate-rss-feeds.ts`

```typescript
/**
 * Generate all RSS feeds after pipeline completion
 * - /rss/all.xml (latest 5 publications)
 * - /rss/updates.xml (last 10 updated articles)
 * - /rss/categories/*.xml (20 articles per category)
 * - /rss/metadata.json (feed information)
 */

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const BASE_URL = 'https://cybernetsec.io'
const RSS_DIR = path.join(process.cwd(), 'public', 'rss')
const CATEGORIES_DIR = path.join(RSS_DIR, 'categories')
const DB_PATH = path.join(process.cwd(), 'logs', 'content-generation.db')

interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
  guid: string
  categories: string[]
  imageUrl?: string
}

// Ensure directories exist
if (!fs.existsSync(RSS_DIR)) {
  fs.mkdirSync(RSS_DIR, { recursive: true })
}
if (!fs.existsSync(CATEGORIES_DIR)) {
  fs.mkdirSync(CATEGORIES_DIR, { recursive: true })
}

const db = new Database(DB_PATH)

// ============================================================================
// RSS XML Generation Helper
// ============================================================================

function generateRSSXML(channel: {
  title: string
  description: string
  link: string
  feedUrl: string
  imageUrl?: string
  items: RSSItem[]
}): string {
  const now = new Date().toUTCString()
  
  const imageTag = channel.imageUrl ? `
    <image>
      <url>${channel.imageUrl}</url>
      <title>${escapeXML(channel.title)}</title>
      <link>${channel.link}</link>
    </image>` : ''
  
  const itemsXML = channel.items.map(item => {
    const categoriesXML = item.categories
      .map(cat => `      <category>${escapeXML(cat)}</category>`)
      .join('\n')
    
    const enclosureTag = item.imageUrl ? `
      <enclosure url="${item.imageUrl}" type="image/webp" length="0"/>` : ''
    
    return `    <item>
      <title>${escapeXML(item.title)}</title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="${item.guid.startsWith('http') ? 'true' : 'false'}">${item.guid}</guid>
${categoriesXML}${enclosureTag}
    </item>`
  }).join('\n\n')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(channel.title)}</title>
    <link>${channel.link}</link>
    <description>${escapeXML(channel.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${channel.feedUrl}" rel="self" type="application/rss+xml"/>${imageTag}

${itemsXML}
  </channel>
</rss>`
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ============================================================================
// 1. Generate All Publications Feed (/rss/all.xml)
// ============================================================================

function generateAllPublicationsFeed() {
  console.log('📰 Generating All Publications feed...')
  
  // Get latest 5 publications from database
  const publications = db.prepare(`
    SELECT 
      p.id,
      p.slug,
      p.type,
      p.headline,
      p.summary,
      p.published_at,
      p.featured_image_url,
      GROUP_CONCAT(DISTINCT c.name) as categories,
      COUNT(DISTINCT pa.article_id) as article_count
    FROM publications p
    LEFT JOIN publication_articles pa ON p.id = pa.publication_id
    LEFT JOIN article_categories ac ON pa.article_id = ac.article_id
    LEFT JOIN categories c ON ac.category_id = c.id
    GROUP BY p.id
    ORDER BY p.published_at DESC
    LIMIT 5
  `).all() as any[]
  
  const items: RSSItem[] = publications.map(pub => ({
    title: pub.headline || `${pub.type} - ${new Date(pub.published_at).toLocaleDateString()}`,
    link: `${BASE_URL}/publications/${pub.slug}`,
    description: formatPublicationDescription(pub),
    pubDate: new Date(pub.published_at).toUTCString(),
    guid: `${BASE_URL}/publications/${pub.slug}`,
    categories: pub.categories ? pub.categories.split(',') : [pub.type],
    imageUrl: pub.featured_image_url ? `${BASE_URL}${pub.featured_image_url}` : undefined
  }))
  
  const xml = generateRSSXML({
    title: 'CybernetSec - Latest Publications',
    description: 'Latest cybersecurity threat intelligence publications including daily digests, weekly roundups, and special reports.',
    link: BASE_URL,
    feedUrl: `${BASE_URL}/rss/all.xml`,
    imageUrl: `${BASE_URL}/images/logo-rss.png`,
    items
  })
  
  fs.writeFileSync(path.join(RSS_DIR, 'all.xml'), xml, 'utf-8')
  console.log(`✅ Generated all.xml with ${items.length} publications`)
  
  return { item_count: items.length, last_updated: new Date().toISOString() }
}

function formatPublicationDescription(pub: any): string {
  let html = `<p>${pub.summary || 'Latest cybersecurity threat intelligence.'}</p>`
  
  if (pub.article_count > 0) {
    html += `<p><strong>Articles:</strong> ${pub.article_count} threat intelligence reports</p>`
  }
  
  return html
}

// ============================================================================
// 2. Generate Updated Articles Feed (/rss/updates.xml)
// ============================================================================

function generateUpdatedArticlesFeed() {
  console.log('🔄 Generating Updated Articles feed...')
  
  // Get last 10 articles that were updated (updated_at > created_at)
  const articles = db.prepare(`
    SELECT 
      a.id,
      a.slug,
      a.headline,
      a.summary,
      a.created_at,
      a.updated_at,
      a.severity,
      a.featured_image_url,
      GROUP_CONCAT(DISTINCT c.name) as categories,
      GROUP_CONCAT(DISTINCT cve.cve_id) as cves,
      GROUP_CONCAT(DISTINCT e.name) as entities
    FROM articles a
    LEFT JOIN article_categories ac ON a.id = ac.article_id
    LEFT JOIN categories c ON ac.category_id = c.id
    LEFT JOIN article_cves acve ON a.id = acve.article_id
    LEFT JOIN cves cve ON acve.cve_id = cve.id
    LEFT JOIN article_entities ae ON a.id = ae.article_id
    LEFT JOIN entities e ON ae.entity_id = e.id
    WHERE a.updated_at > a.created_at
    GROUP BY a.id
    ORDER BY a.updated_at DESC
    LIMIT 10
  `).all() as any[]
  
  // Only generate if there are updates
  if (articles.length === 0) {
    console.log('⏭️  No updated articles - skipping updates.xml generation')
    return { item_count: 0, last_updated: new Date().toISOString() }
  }
  
  const items: RSSItem[] = articles.map(article => ({
    title: `[UPDATE] ${article.headline}`,
    link: `${BASE_URL}/articles/${article.slug}`,
    description: formatUpdateDescription(article),
    pubDate: new Date(article.updated_at).toUTCString(),
    guid: `article:${article.slug}:update:${getUpdateCount(article)}`,
    categories: article.categories ? [...article.categories.split(','), 'UPDATE'] : ['UPDATE'],
    imageUrl: article.featured_image_url ? `${BASE_URL}${article.featured_image_url}` : undefined
  }))
  
  const xml = generateRSSXML({
    title: 'CybernetSec - Article Updates',
    description: 'Recently updated cybersecurity threat intelligence articles with new information, IOCs, or developments.',
    link: BASE_URL,
    feedUrl: `${BASE_URL}/rss/updates.xml`,
    imageUrl: `${BASE_URL}/images/logo-rss.png`,
    items
  })
  
  fs.writeFileSync(path.join(RSS_DIR, 'updates.xml'), xml, 'utf-8')
  console.log(`✅ Generated updates.xml with ${items.length} updated articles`)
  
  return { item_count: items.length, last_updated: new Date().toISOString() }
}

function formatUpdateDescription(article: any): string {
  let html = `<p><strong>Update:</strong> ${article.summary}</p>`
  
  if (article.cves) {
    const cveList = article.cves.split(',').map((c: string) => `<li>${c}</li>`).join('')
    html += `<p><strong>CVEs:</strong></p><ul>${cveList}</ul>`
  }
  
  if (article.severity) {
    html += `<p><strong>Severity:</strong> ${article.severity.toUpperCase()}</p>`
  }
  
  const updatedDate = new Date(article.updated_at).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  })
  html += `<p><strong>Updated:</strong> ${updatedDate}</p>`
  
  return html
}

function getUpdateCount(article: any): number {
  // Simple heuristic: count hours between created and updated
  const created = new Date(article.created_at).getTime()
  const updated = new Date(article.updated_at).getTime()
  const hoursDiff = Math.floor((updated - created) / (1000 * 60 * 60))
  return Math.max(1, Math.floor(hoursDiff / 24)) // Roughly 1 per day
}

// ============================================================================
// 3. Generate Category-Specific Feeds
// ============================================================================

function generateCategoryFeeds() {
  console.log('📂 Generating category-specific feeds...')
  
  // Get all categories with article counts
  const categories = db.prepare(`
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.description,
      COUNT(DISTINCT ac.article_id) as article_count
    FROM categories c
    LEFT JOIN article_categories ac ON c.id = ac.category_id
    GROUP BY c.id
    HAVING article_count > 0
    ORDER BY article_count DESC
  `).all() as any[]
  
  const categoryMetadata = []
  
  for (const category of categories) {
    // Get latest 20 articles in this category
    const articles = db.prepare(`
      SELECT 
        a.id,
        a.slug,
        a.headline,
        a.summary,
        a.severity,
        a.published_at,
        a.updated_at,
        a.featured_image_url,
        GROUP_CONCAT(DISTINCT c2.name) as all_categories,
        GROUP_CONCAT(DISTINCT cve.cve_id) as cves,
        GROUP_CONCAT(DISTINCT e.name) as entities
      FROM articles a
      INNER JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN article_categories ac2 ON a.id = ac2.article_id
      LEFT JOIN categories c2 ON ac2.category_id = c2.id
      LEFT JOIN article_cves acve ON a.id = acve.article_id
      LEFT JOIN cves cve ON acve.cve_id = cve.id
      LEFT JOIN article_entities ae ON a.id = ae.article_id
      LEFT JOIN entities e ON ae.entity_id = e.id
      WHERE ac.category_id = ?
      GROUP BY a.id
      ORDER BY a.updated_at DESC
      LIMIT 20
    `).all(category.id) as any[]
    
    const items: RSSItem[] = articles.map(article => ({
      title: article.headline,
      link: `${BASE_URL}/articles/${article.slug}`,
      description: formatArticleDescription(article),
      pubDate: new Date(article.updated_at).toUTCString(),
      guid: `${BASE_URL}/articles/${article.slug}`,
      categories: article.all_categories ? article.all_categories.split(',') : [category.name],
      imageUrl: article.featured_image_url ? `${BASE_URL}${article.featured_image_url}` : undefined
    }))
    
    const xml = generateRSSXML({
      title: `CybernetSec - ${category.name}`,
      description: category.description || `Latest ${category.name.toLowerCase()} threat intelligence including attack campaigns, vulnerabilities, and mitigation strategies.`,
      link: BASE_URL,
      feedUrl: `${BASE_URL}/rss/categories/${category.slug}.xml`,
      imageUrl: `${BASE_URL}/images/categories/${category.slug}.png`,
      items
    })
    
    fs.writeFileSync(path.join(CATEGORIES_DIR, `${category.slug}.xml`), xml, 'utf-8')
    console.log(`  ✅ Generated ${category.slug}.xml with ${items.length} articles`)
    
    categoryMetadata.push({
      slug: category.slug,
      title: category.name,
      description: category.description || `Latest ${category.name.toLowerCase()} threat intelligence`,
      url: `/rss/categories/${category.slug}.xml`,
      full_url: `${BASE_URL}/rss/categories/${category.slug}.xml`,
      item_count: items.length,
      article_count: category.article_count,
      last_updated: new Date().toISOString(),
      icon: getCategoryIcon(category.slug)
    })
  }
  
  console.log(`✅ Generated ${categoryMetadata.length} category feeds`)
  return categoryMetadata
}

function formatArticleDescription(article: any): string {
  let html = `<p>${article.summary || 'Cybersecurity threat intelligence report.'}</p>`
  
  if (article.severity) {
    html += `<p><strong>Severity:</strong> ${article.severity.toUpperCase()}</p>`
  }
  
  if (article.cves) {
    html += `<p><strong>CVEs:</strong> ${article.cves}</p>`
  }
  
  if (article.entities) {
    const entityList = article.entities.split(',').slice(0, 5).join(', ')
    html += `<p><strong>Related:</strong> ${entityList}</p>`
  }
  
  return html
}

function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    'ransomware': '🔒',
    'vulnerability': '🔓',
    'data-breach': '💾',
    'threat-actor': '👤',
    'malware': '🦠',
    'apt': '🎯',
    'zero-day': '⚡',
    'phishing': '🎣',
    'supply-chain': '🔗',
    'cloud-security': '☁️',
    'iot-security': '📱',
    'mobile-security': '📲'
  }
  return icons[slug] || '🔐'
}

// ============================================================================
// 4. Generate Feed Metadata JSON
// ============================================================================

function generateMetadata(
  allFeed: any,
  updatesFeed: any,
  categoryFeeds: any[]
) {
  console.log('📋 Generating feed metadata...')
  
  const metadata = {
    generated_at: new Date().toISOString(),
    feeds: {
      all: {
        title: 'All Publications',
        description: 'Latest 5 publications including daily digests, weekly roundups, and special reports',
        url: '/rss/all.xml',
        full_url: `${BASE_URL}/rss/all.xml`,
        item_count: allFeed.item_count,
        last_updated: allFeed.last_updated,
        update_frequency: 'Daily'
      },
      updates: {
        title: 'Article Updates',
        description: 'Recently updated articles with new information, IOCs, or developments (last 10)',
        url: '/rss/updates.xml',
        full_url: `${BASE_URL}/rss/updates.xml`,
        item_count: updatesFeed.item_count,
        last_updated: updatesFeed.last_updated,
        update_frequency: 'As articles are updated'
      },
      categories: categoryFeeds
    },
    statistics: {
      total_feeds: 2 + categoryFeeds.length,
      total_articles: db.prepare('SELECT COUNT(*) as count FROM articles').get() as any,
      total_publications: db.prepare('SELECT COUNT(*) as count FROM publications').get() as any,
      categories_count: categoryFeeds.length,
      last_pipeline_run: new Date().toISOString()
    }
  }
  
  fs.writeFileSync(
    path.join(RSS_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8'
  )
  
  console.log('✅ Generated metadata.json')
  return metadata
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Starting RSS feed generation...\n')
  
  try {
    const allFeed = generateAllPublicationsFeed()
    const updatesFeed = generateUpdatedArticlesFeed()
    const categoryFeeds = generateCategoryFeeds()
    const metadata = generateMetadata(allFeed, updatesFeed, categoryFeeds)
    
    console.log('\n✅ RSS feed generation complete!')
    console.log(`   - All Publications: ${allFeed.item_count} items`)
    console.log(`   - Updated Articles: ${updatesFeed.item_count} items`)
    console.log(`   - Category Feeds: ${categoryFeeds.length} feeds`)
    console.log(`\n📁 Feeds available at: ${BASE_URL}/rss/`)
    
    db.close()
  } catch (error) {
    console.error('❌ Error generating RSS feeds:', error)
    db.close()
    process.exit(1)
  }
}

main()
```

---

## 🔄 Integration with Pipeline

### Update `run-pipeline.ts`

Add RSS generation as Step 8:

```typescript
// After Step 7 (generate indexes)
if (shouldRunStep(8)) {
  console.log('\n⏯️  Step 8: Generate RSS Feeds')
  execSync(
    `npx tsx ${scriptsDir}/generate-rss-feeds.ts`,
    { stdio: 'inherit' }
  )
}
```

---

## 📝 Implementation Checklist

### Phase 1: RSS Generation Script (Priority 1)
- [ ] Create `scripts/content-generation/cli/generate-rss-feeds.ts`
- [ ] Implement `generateAllPublicationsFeed()` function
- [ ] Implement `generateUpdatedArticlesFeed()` function
- [ ] Implement `generateCategoryFeeds()` function
- [ ] Implement `generateMetadata()` function
- [ ] Add RSS generation to pipeline as Step 8
- [ ] Test with existing database data

### Phase 2: RSS Subscription Page (Priority 1)
- [ ] Create `/pages/rss.vue` page component
- [ ] Implement feed URL copy functionality
- [ ] Add responsive styling
- [ ] Test metadata.json loading
- [ ] Add link to RSS page in header/footer

### Phase 3: Testing & Validation (Priority 1)
- [ ] Validate RSS XML with W3C Feed Validator
- [ ] Test feeds in Feedly
- [ ] Test feeds in Inoreader
- [ ] Test feeds in NetNewsWire
- [ ] Verify GUID uniqueness
- [ ] Verify update detection works

### Phase 4: Documentation (Priority 2)
- [ ] Update HANDOFF-PIPELINE-AUTOMATION.md with Step 8
- [ ] Document RSS feed URLs
- [ ] Add RSS feeds to README.md
- [ ] Create troubleshooting guide

### Phase 5: Enhancements (Priority 3)
- [ ] Add severity-based feeds (critical-only, high-and-critical)
- [ ] Add entity-based feeds (specific threat actors, companies)
- [ ] Add geographic feeds (by region)
- [ ] Email subscription system (future)

---

## 🎯 Expected Outcomes

### User Benefits:
✅ Real-time updates via RSS readers  
✅ Choose specific content (publications vs updates vs categories)  
✅ No email required (privacy-friendly)  
✅ Standard RSS 2.0 format (works everywhere)  
✅ Clear documentation and easy subscription

### Technical Benefits:
✅ Automated generation (no manual work)  
✅ Standards-compliant RSS 2.0 XML  
✅ Efficient database queries  
✅ Proper GUID handling for updates  
✅ Scalable category feed system

---

## 🔗 RSS Feed URLs Summary

```
Main Feeds:
https://cybernetsec.io/rss/all.xml        - Latest 5 publications
https://cybernetsec.io/rss/updates.xml    - Last 10 updated articles

Category Feeds:
https://cybernetsec.io/rss/categories/ransomware.xml
https://cybernetsec.io/rss/categories/vulnerability.xml
https://cybernetsec.io/rss/categories/data-breach.xml
https://cybernetsec.io/rss/categories/threat-actor.xml
... (dynamically generated for all categories)

Subscription Page:
https://cybernetsec.io/rss                - User-facing subscription page
```

---

**Status:** 📋 APPROVED - Ready for implementation  
**Estimated Implementation:** 1-2 days  
**Priority:** HIGH - Core feature for user engagement
  
  // Add publications
  for (const pub of manifest.publications) {
    items.push({
      title: pub.title,
      link: pub.permalink,
      description: pub.description,
      pubDate: new Date(pub.published_at).toUTCString(),
      guid: pub.rss_metadata.guid,
      category: pub.rss_metadata.categories,
      enclosure: pub.rss_metadata.enclosure
    })
    
    // Add individual articles
    for (const article of pub.articles) {
      items.push({
        title: article.title,
        link: article.permalink,
        description: article.excerpt,
        pubDate: new Date(article.updated_at).toUTCString(),
        guid: article.rss_metadata.guid,
        category: article.rss_metadata.categories,
        enclosure: article.rss_metadata.enclosure
      })
    }
  }
  
  // Add page updates
  for (const page of manifest.pages_updated) {
    items.push({
      title: page.title,
      link: page.permalink,
      description: page.update_reason,
      pubDate: new Date(page.updated_at).toUTCString(),
      guid: page.rss_metadata.guid,
      category: page.rss_metadata.categories
    })
  }
  
  return buildRSSXML(items)
}
```

### Email Subscription Filtering

```typescript
// Filter manifest for user subscriptions
function filterForSubscription(
  manifest: UpdateManifest,
  subscription: UserSubscription
): UpdateManifest {
  
  const filtered = { ...manifest, publications: [] }
  
  for (const pub of manifest.publications) {
    const matchingArticles = pub.articles.filter(article => {
      // Check if article matches user's subscription criteria
      return article.email_metadata.subscription_triggers?.some(trigger => 
        subscription.triggers.includes(trigger)
      )
    })
    
    if (matchingArticles.length > 0) {
      filtered.publications.push({
        ...pub,
        articles: matchingArticles,
        article_count: matchingArticles.length
      })
    }
  }
  
  return filtered
}

// Example subscription
const userSubscription = {
  user_id: "user-123",
  triggers: [
    "severity:critical",              // All critical articles
    "category:Ransomware",            // All ransomware articles
    "tag:CL0P",                       // Specific threat actor
    "article_update:article-2025-10-05-001"  // Specific article updates
  ]
}
```

---

## 📁 File Management

### File Locations

```
public/data/
├── latest-update-manifest.json          # Current manifest (symlink)
├── manifests/
│   ├── manifest-2025-10-13-run-001.json # Today's run
│   ├── manifest-2025-10-12-run-001.json # Yesterday
│   ├── manifest-2025-10-11-run-001.json
│   └── ...
└── rss/
    ├── feed.xml                         # Main RSS feed (all content)
    ├── feed-critical.xml                # Critical severity only
    ├── feed-ransomware.xml              # Ransomware category
    └── ...
```

### Manifest Archive Strategy

**Retention:**
- Keep all manifests for 90 days
- Archive older manifests to `manifests/archive/YYYY/MM/`
- Compress archives after 30 days (gzip)

**Naming Convention:**
```
manifest-{YYYY-MM-DD}-run-{NNN}.json
```

Where `NNN` is incremented for multiple runs per day.

---

## 🔔 Integration Points

### 1. Pipeline Integration (Step 7+)

Add new step after index generation:

```typescript
// scripts/content-generation/cli/generate-manifest.ts
async function generateManifest(pipelineContext: PipelineContext) {
  const manifest: UpdateManifest = {
    manifest_version: '1.0',
    generated_at: new Date().toISOString(),
    pipeline_run_id: pipelineContext.runId,
    timeframe: pipelineContext.timeframe,
    
    summary: calculateSummary(pipelineContext),
    publications: buildPublicationEntries(pipelineContext),
    pages_updated: buildPageUpdates(pipelineContext),
    subscription_filters: buildFilters(pipelineContext),
    pipeline_metadata: pipelineContext.metadata
  }
  
  // Save manifest
  await saveManifest(manifest)
  
  // Update symlink
  await updateLatestManifest(manifest)
  
  // Generate RSS feeds
  await generateRSSFeeds(manifest)
}
```

### 2. RSS Feed Generation

```typescript
// server/api/rss/feed.xml.ts
export default defineEventHandler(async (event) => {
  const manifest = await loadLatestManifest()
  const rssXML = generateRSSFeed(manifest)
  
  setHeader(event, 'Content-Type', 'application/rss+xml')
  return rssXML
})
```

### 3. Email Notification Service

```typescript
// Future: Email notification service
async function sendEmailNotifications(manifest: UpdateManifest) {
  const subscribers = await loadSubscribers()
  
  for (const subscriber of subscribers) {
    const filtered = filterForSubscription(manifest, subscriber)
    
    if (hasMatchingContent(filtered)) {
      await sendEmail({
        to: subscriber.email,
        subject: buildSubject(filtered),
        html: buildEmailHTML(filtered)
      })
    }
  }
}
```

---

## ✅ Benefits

### For RSS Feeds:
✅ Complete metadata for RSS 2.0 spec  
✅ Unique GUIDs for updates vs new content  
✅ Category tags for filtering  
✅ Image enclosures for rich feeds  
✅ Proper timestamps and permalinks

### For Email Subscriptions:
✅ Subscription trigger matching  
✅ Priority levels for send ordering  
✅ Preview text for email clients  
✅ Subject line templates  
✅ Filter by severity, category, tags, entities

### For User Experience:
✅ Single source of truth for latest updates  
✅ Historical tracking of all changes  
✅ Fine-grained subscription options  
✅ Clear distinction between NEW and UPDATE  
✅ Full context for why articles were updated

---

## 🎯 Next Steps

### Phase 1: Implement Manifest Generation
- [ ] Create `generate-manifest.ts` script
- [ ] Add to pipeline (Step 8)
- [ ] Test with existing publications

### Phase 2: RSS Feed Integration
- [ ] Create RSS feed generator
- [ ] Add API routes for feeds
- [ ] Test with RSS readers

### Phase 3: Email Infrastructure (Future)
- [ ] Design subscriber database schema
- [ ] Build subscription management UI
- [ ] Implement email sending service
- [ ] Add unsubscribe handling

### Phase 4: Archive Management
- [ ] Implement manifest archiving
- [ ] Add compression for old manifests
- [ ] Create manifest query API

---

## 📝 Open Questions

1. **Manifest History**: How many days should we keep in `latest-update-manifest.json`? (Proposal: just current run)

2. **RSS Feed Variants**: Which category/severity RSS feeds should we generate automatically?

3. **Page Update Tracking**: Should we track ALL page updates or only significant ones?

4. **Entity Subscriptions**: Should users be able to subscribe to specific companies, threat actors, CVEs?

5. **Update Notifications**: Send email immediately on update or batch in daily digest?

---

**Status:** 📋 PROPOSED - Ready for review and feedback

**Estimated Implementation:** 2-3 days for manifest generation + RSS feeds
