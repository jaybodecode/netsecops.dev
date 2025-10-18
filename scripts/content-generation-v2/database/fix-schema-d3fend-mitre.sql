-- Fix Schema: Add Missing D3FEND and MITRE Mitigations Support
-- Date: 2025-10-18
-- Purpose: Add url and mitre_mitigation_id to d3fend table, create mitre_mitigations table

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. ALTER article_d3fend_countermeasures to add missing columns
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Add url column (D3FEND technique URL)
ALTER TABLE article_d3fend_countermeasures 
ADD COLUMN url TEXT;

-- Add mitre_mitigation_id column (maps back to MITRE mitigation)
ALTER TABLE article_d3fend_countermeasures 
ADD COLUMN mitre_mitigation_id TEXT;

-- Create index on mitre_mitigation_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_article_d3fend_mitre_id 
ON article_d3fend_countermeasures(mitre_mitigation_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. CREATE article_mitre_mitigations table
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS article_mitre_mitigations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  mitigation_id TEXT NOT NULL,  -- e.g., M1051, M1047
  name TEXT NOT NULL,            -- e.g., "Update Software", "Audit"
  domain TEXT,                   -- e.g., "enterprise", "ics", "mobile"
  description TEXT,              -- How this mitigation applies to the article
  d3fend_techniques TEXT,        -- JSON array of D3FEND techniques mapped to this mitigation
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_article_mitre_mitigations_article_id 
ON article_mitre_mitigations(article_id);

CREATE INDEX IF NOT EXISTS idx_article_mitre_mitigations_mitigation_id 
ON article_mitre_mitigations(mitigation_id);

CREATE INDEX IF NOT EXISTS idx_article_mitre_mitigations_domain 
ON article_mitre_mitigations(domain);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Verification Queries (comment out for execution)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Check article_d3fend_countermeasures schema
-- .schema article_d3fend_countermeasures

-- Check article_mitre_mitigations schema
-- .schema article_mitre_mitigations

-- Count existing data
-- SELECT COUNT(*) FROM article_d3fend_countermeasures;
-- SELECT COUNT(*) FROM article_mitre_mitigations;
