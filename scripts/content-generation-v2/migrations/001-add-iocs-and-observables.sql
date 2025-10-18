-- Migration: Add IOCs and Cyber Observables tables
-- Date: 2025-10-17
-- Description: Add support for article-sourced IOCs and LLM-generated cyber observables

-- Article IOCs table (indicators directly from articles)
CREATE TABLE IF NOT EXISTS article_iocs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  source TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_iocs_article_id ON article_iocs(article_id);
CREATE INDEX IF NOT EXISTS idx_article_iocs_type ON article_iocs(type);
CREATE INDEX IF NOT EXISTS idx_article_iocs_value ON article_iocs(value);

-- Article Cyber Observables table (LLM-generated detection indicators)
CREATE TABLE IF NOT EXISTS article_cyber_observables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT NOT NULL,
  context TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK(confidence IN ('high', 'medium', 'low')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_cyber_observables_article_id ON article_cyber_observables(article_id);
CREATE INDEX IF NOT EXISTS idx_article_cyber_observables_type ON article_cyber_observables(type);
CREATE INDEX IF NOT EXISTS idx_article_cyber_observables_confidence ON article_cyber_observables(confidence);
