-- Migration: Add MITRE D3FEND countermeasures table
-- Date: 2025-10-17
-- Description: Add support for defensive countermeasures from MITRE D3FEND framework

CREATE TABLE IF NOT EXISTS article_d3fend_countermeasures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  technique_id TEXT NOT NULL,
  technique_name TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_d3fend_article_id ON article_d3fend_countermeasures(article_id);
CREATE INDEX IF NOT EXISTS idx_article_d3fend_technique_id ON article_d3fend_countermeasures(technique_id);
