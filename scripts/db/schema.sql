-- ============================================================================
-- CyberSec Content Database Schema
-- ============================================================================
-- Purpose: Entity-relationship database for cybersecurity articles
-- Database: SQLite
-- Created: October 13, 2025
-- ============================================================================

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Articles table (fingerprint metadata)
CREATE TABLE IF NOT EXISTS articles (
    article_id VARCHAR(50) PRIMARY KEY,        -- article-2025-10-13-001
    slug VARCHAR(100) UNIQUE NOT NULL,         -- ransomware-memorial-hospital
    headline VARCHAR(100),
    title VARCHAR(200),
    summary TEXT,
    category VARCHAR(50),
    severity VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    fingerprint VARCHAR(64)                     -- SHA-256 of entity combo
);

-- Create indexes for articles table
CREATE INDEX IF NOT EXISTS idx_articles_fingerprint ON articles(fingerprint);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_severity ON articles(severity);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- ============================================================================
-- Entity Tables
-- ============================================================================

-- CVE entities
CREATE TABLE IF NOT EXISTS cves (
    cve_id VARCHAR(20) PRIMARY KEY,             -- CVE-2025-1234
    cvss_score DECIMAL(3,1),
    severity VARCHAR(20),
    kev INTEGER DEFAULT 0,                      -- 0=false, 1=true (SQLite doesn't have native boolean)
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Create indexes for cves table
CREATE INDEX IF NOT EXISTS idx_cves_severity ON cves(severity);
CREATE INDEX IF NOT EXISTS idx_cves_kev ON cves(kev);
CREATE INDEX IF NOT EXISTS idx_cves_cvss ON cves(cvss_score DESC);

-- Generic entities (companies, threat actors, malware, etc.)
CREATE TABLE IF NOT EXISTS entities (
    entity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name VARCHAR(200) UNIQUE NOT NULL,   -- Microsoft, APT29, LockBit
    entity_type VARCHAR(50),                    -- vendor, threat_actor, malware, company, product
    stix_type VARCHAR(50),                      -- identity, threat-actor, malware
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Create indexes for entities table
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_stix ON entities(stix_type);

-- MITRE ATT&CK techniques
CREATE TABLE IF NOT EXISTS mitre_techniques (
    technique_id VARCHAR(20) PRIMARY KEY,       -- T1059.001
    technique_name VARCHAR(200),                -- PowerShell
    tactic VARCHAR(100),                        -- Execution
    description TEXT,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for mitre_techniques table
CREATE INDEX IF NOT EXISTS idx_mitre_tactic ON mitre_techniques(tactic);
CREATE INDEX IF NOT EXISTS idx_mitre_name ON mitre_techniques(technique_name);

-- ============================================================================
-- Junction Tables (Many-to-Many Relationships)
-- ============================================================================

-- Article <-> CVE relationships
CREATE TABLE IF NOT EXISTS article_cves (
    article_id VARCHAR(50) NOT NULL,
    cve_id VARCHAR(20) NOT NULL,
    PRIMARY KEY (article_id, cve_id),
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE,
    FOREIGN KEY (cve_id) REFERENCES cves(cve_id) ON DELETE CASCADE
);

-- Create indexes for article_cves junction table
CREATE INDEX IF NOT EXISTS idx_article_cves_article ON article_cves(article_id);
CREATE INDEX IF NOT EXISTS idx_article_cves_cve ON article_cves(cve_id);

-- Article <-> Entity relationships
CREATE TABLE IF NOT EXISTS article_entities (
    article_id VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    PRIMARY KEY (article_id, entity_id),
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES entities(entity_id) ON DELETE CASCADE
);

-- Create indexes for article_entities junction table
CREATE INDEX IF NOT EXISTS idx_article_entities_article ON article_entities(article_id);
CREATE INDEX IF NOT EXISTS idx_article_entities_entity ON article_entities(entity_id);

-- Article <-> MITRE technique relationships
CREATE TABLE IF NOT EXISTS article_mitre (
    article_id VARCHAR(50) NOT NULL,
    technique_id VARCHAR(20) NOT NULL,
    PRIMARY KEY (article_id, technique_id),
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE,
    FOREIGN KEY (technique_id) REFERENCES mitre_techniques(technique_id) ON DELETE CASCADE
);

-- Create indexes for article_mitre junction table
CREATE INDEX IF NOT EXISTS idx_article_mitre_article ON article_mitre(article_id);
CREATE INDEX IF NOT EXISTS idx_article_mitre_technique ON article_mitre(technique_id);

-- ============================================================================
-- Publications Table
-- ============================================================================

-- Publications (collections of articles)
CREATE TABLE IF NOT EXISTS publications (
    pub_id VARCHAR(50) PRIMARY KEY,             -- daily-2025-10-13
    slug VARCHAR(100) UNIQUE NOT NULL,          -- daily-2025-10-13
    headline VARCHAR(200),
    summary TEXT,
    pub_type VARCHAR(50),                       -- daily, weekly, special
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create indexes for publications table
CREATE INDEX IF NOT EXISTS idx_publications_type ON publications(pub_type);
CREATE INDEX IF NOT EXISTS idx_publications_created ON publications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publications_slug ON publications(slug);

-- Publication <-> Article relationships
CREATE TABLE IF NOT EXISTS publication_articles (
    pub_id VARCHAR(50) NOT NULL,
    article_id VARCHAR(50) NOT NULL,
    article_order INTEGER DEFAULT 0,            -- Order within publication
    PRIMARY KEY (pub_id, article_id),
    FOREIGN KEY (pub_id) REFERENCES publications(pub_id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE
);

-- Create indexes for publication_articles junction table
CREATE INDEX IF NOT EXISTS idx_publication_articles_pub ON publication_articles(pub_id);
CREATE INDEX IF NOT EXISTS idx_publication_articles_article ON publication_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_publication_articles_order ON publication_articles(pub_id, article_order);

-- Raw AI outputs for audit trail
CREATE TABLE IF NOT EXISTS publications_raw (
    raw_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pub_id VARCHAR(50) NOT NULL,                -- Links to publications table (not enforced)
    raw_data TEXT NOT NULL,                     -- Full JSON from AI generation
    model_used VARCHAR(50),                     -- e.g., gemini-2.0-flash-exp
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Note: No FOREIGN KEY - allows saving raw output before publication created
);

-- Create indexes for publications_raw table
CREATE INDEX IF NOT EXISTS idx_publications_raw_pub ON publications_raw(pub_id);
CREATE INDEX IF NOT EXISTS idx_publications_raw_created ON publications_raw(created_at DESC);

-- ============================================================================
-- Metadata and Stats Tables
-- ============================================================================

-- Track pipeline runs and costs
CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_type VARCHAR(50),                       -- daily, weekly, manual
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20),                         -- running, completed, failed
    articles_generated INTEGER DEFAULT 0,
    articles_new INTEGER DEFAULT 0,
    articles_updated INTEGER DEFAULT 0,
    articles_skipped INTEGER DEFAULT 0,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0,
    error_message TEXT
);

-- Create indexes for pipeline_runs table
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started ON pipeline_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_type ON pipeline_runs(run_type);

-- Track individual API calls for detailed cost analysis
CREATE TABLE IF NOT EXISTS api_calls (
    call_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER,                             -- Links to pipeline_runs
    api_provider VARCHAR(20),                   -- gemini, vertex, genkit_gemini, genkit_vertex
    model_name VARCHAR(100),                    -- gemini-2.0-flash-exp, gemini-1.5-pro, etc.
    operation VARCHAR(50),                      -- search, generate_publication, generate_article
    prompt_length INTEGER,                      -- Character count of prompt
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    tokens_total INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0,
    duration_ms INTEGER,                        -- Time taken for API call
    status VARCHAR(20),                         -- success, error, retry
    error_message TEXT,
    called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES pipeline_runs(run_id) ON DELETE CASCADE
);

-- Create indexes for api_calls table
CREATE INDEX IF NOT EXISTS idx_api_calls_run ON api_calls(run_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_provider ON api_calls(api_provider);
CREATE INDEX IF NOT EXISTS idx_api_calls_model ON api_calls(model_name);
CREATE INDEX IF NOT EXISTS idx_api_calls_operation ON api_calls(operation);
CREATE INDEX IF NOT EXISTS idx_api_calls_called ON api_calls(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_calls_status ON api_calls(status);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View: Article with entity counts
CREATE VIEW IF NOT EXISTS v_articles_with_counts AS
SELECT 
    a.*,
    (SELECT COUNT(*) FROM article_cves ac WHERE ac.article_id = a.article_id) as cve_count,
    (SELECT COUNT(*) FROM article_entities ae WHERE ae.article_id = a.article_id) as entity_count,
    (SELECT COUNT(*) FROM article_mitre am WHERE am.article_id = a.article_id) as mitre_count
FROM articles a;

-- View: Entity usage statistics
CREATE VIEW IF NOT EXISTS v_entity_stats AS
SELECT 
    e.entity_id,
    e.entity_name,
    e.entity_type,
    COUNT(ae.article_id) as article_count,
    MAX(a.created_at) as last_seen
FROM entities e
LEFT JOIN article_entities ae ON e.entity_id = ae.entity_id
LEFT JOIN articles a ON ae.article_id = a.article_id
GROUP BY e.entity_id, e.entity_name, e.entity_type;

-- View: CVE usage statistics
CREATE VIEW IF NOT EXISTS v_cve_stats AS
SELECT 
    c.cve_id,
    c.severity,
    c.cvss_score,
    c.kev,
    COUNT(ac.article_id) as article_count,
    MAX(a.created_at) as last_mentioned
FROM cves c
LEFT JOIN article_cves ac ON c.cve_id = ac.cve_id
LEFT JOIN articles a ON ac.article_id = a.article_id
GROUP BY c.cve_id, c.severity, c.cvss_score, c.kev;

-- View: MITRE technique usage
CREATE VIEW IF NOT EXISTS v_mitre_stats AS
SELECT 
    m.technique_id,
    m.technique_name,
    m.tactic,
    COUNT(am.article_id) as article_count,
    MAX(a.created_at) as last_used
FROM mitre_techniques m
LEFT JOIN article_mitre am ON m.technique_id = am.technique_id
LEFT JOIN articles a ON am.article_id = a.article_id
GROUP BY m.technique_id, m.technique_name, m.tactic;

-- View: Cost analysis by pipeline run
CREATE VIEW IF NOT EXISTS v_cost_by_run AS
SELECT 
    pr.run_id,
    pr.run_type,
    pr.started_at,
    pr.completed_at,
    pr.status,
    pr.articles_generated,
    pr.tokens_input,
    pr.tokens_output,
    pr.cost_usd as total_cost,
    (SELECT COUNT(*) FROM api_calls WHERE run_id = pr.run_id) as api_call_count,
    (SELECT SUM(cost_usd) FROM api_calls WHERE run_id = pr.run_id) as api_cost_total,
    ROUND(CAST(pr.cost_usd AS REAL) / NULLIF(pr.articles_generated, 0), 4) as cost_per_article
FROM pipeline_runs pr
ORDER BY pr.started_at DESC;

-- View: Cost analysis by API provider
CREATE VIEW IF NOT EXISTS v_cost_by_provider AS
SELECT 
    api_provider,
    COUNT(*) as call_count,
    SUM(tokens_input) as total_input_tokens,
    SUM(tokens_output) as total_output_tokens,
    SUM(tokens_total) as total_tokens,
    SUM(cost_usd) as total_cost,
    AVG(cost_usd) as avg_cost_per_call,
    AVG(duration_ms) as avg_duration_ms
FROM api_calls
WHERE status = 'success'
GROUP BY api_provider
ORDER BY total_cost DESC;

-- View: Cost analysis by model
CREATE VIEW IF NOT EXISTS v_cost_by_model AS
SELECT 
    model_name,
    api_provider,
    COUNT(*) as call_count,
    SUM(tokens_input) as total_input_tokens,
    SUM(tokens_output) as total_output_tokens,
    SUM(cost_usd) as total_cost,
    AVG(cost_usd) as avg_cost_per_call,
    AVG(duration_ms) as avg_duration_ms
FROM api_calls
WHERE status = 'success'
GROUP BY model_name, api_provider
ORDER BY total_cost DESC;

-- View: Cost analysis by operation type
CREATE VIEW IF NOT EXISTS v_cost_by_operation AS
SELECT 
    operation,
    COUNT(*) as call_count,
    SUM(tokens_input) as total_input_tokens,
    SUM(tokens_output) as total_output_tokens,
    SUM(cost_usd) as total_cost,
    AVG(cost_usd) as avg_cost_per_call,
    AVG(duration_ms) as avg_duration_ms
FROM api_calls
WHERE status = 'success'
GROUP BY operation
ORDER BY total_cost DESC;

-- View: Daily cost summary
CREATE VIEW IF NOT EXISTS v_daily_costs AS
SELECT 
    DATE(called_at) as date,
    COUNT(*) as total_calls,
    SUM(tokens_input) as total_input_tokens,
    SUM(tokens_output) as total_output_tokens,
    SUM(cost_usd) as total_cost,
    COUNT(DISTINCT run_id) as pipeline_runs
FROM api_calls
WHERE status = 'success'
GROUP BY DATE(called_at)
ORDER BY date DESC;

-- ============================================================================
-- Database Metadata
-- ============================================================================

-- Store schema version for migrations
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Insert initial schema version
INSERT OR IGNORE INTO schema_version (version, description) 
VALUES (3, 'Added publications_raw table for audit trail');

-- ============================================================================
-- End of Schema
-- ============================================================================
