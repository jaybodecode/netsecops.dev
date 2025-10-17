#!/bin/bash
#
# V3 Pipeline Validation Script
# Tests complete workflow: Step 3 → Step 4 → Step 5 → Step 6 → Step 7
#
# Prerequisites:
# - raw_search data exists for the date
# - structured_news data exists for the date
#
# This script validates:
# - Step 3: Insert articles + FTS5 indexing
# - Step 4: Duplicate detection with V3 (FTS5 BM25)
# - Step 5: Generate publications
# - Step 6: Export JSON files
# - Step 7: Generate indexes & RSS

set -e  # Exit on error

# Configuration
DATE=${1:-"2025-10-07"}  # Default to Oct 7 if not specified
SCRIPTS_DIR="scripts/content-generation-v2"
DB_PATH="logs/content-generation-v2.db"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 V3 Pipeline Validation Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 Date: $DATE"
echo "📂 Database: $DB_PATH"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
RAW_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM raw_search WHERE DATE(pub_date) = '$DATE'")
STRUCT_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM structured_news WHERE DATE(pub_date) = '$DATE'")

echo "   Raw search data: $RAW_COUNT rows"
echo "   Structured news: $STRUCT_COUNT rows"

if [ "$RAW_COUNT" -eq 0 ]; then
  echo "❌ ERROR: No raw_search data for $DATE"
  echo "   Run: npx tsx $SCRIPTS_DIR/search-news.ts --date $DATE"
  exit 1
fi

if [ "$STRUCT_COUNT" -eq 0 ]; then
  echo "❌ ERROR: No structured_news data for $DATE"
  echo "   Run: npx tsx $SCRIPTS_DIR/news-structured.ts --date $DATE --logtodb"
  exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Step 3: Insert Articles
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 Step 3: Insert Articles + Build FTS5 Index"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx $SCRIPTS_DIR/insert-articles.ts --date $DATE

ARTICLE_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM articles WHERE DATE(created_at) = '$DATE'")
FTS_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM articles_fts")
echo ""
echo "✅ Step 3 complete: $ARTICLE_COUNT articles inserted, $FTS_COUNT in FTS5 index"
echo ""

# Step 4: Check Duplicates (V3)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Step 4: Duplicate Detection (V3 FTS5 BM25)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx $SCRIPTS_DIR/check-duplicates-v3.ts --date $DATE

echo ""
echo "📊 Resolution Summary:"
sqlite3 $DB_PATH "SELECT resolution, COUNT(*) as count FROM articles WHERE DATE(created_at) = '$DATE' GROUP BY resolution" | while read line; do
  echo "   $line"
done
echo ""
echo "✅ Step 4 complete"
echo ""

# Step 5: Generate Publications
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📰 Step 5: Generate Publications"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx $SCRIPTS_DIR/generate-publication.ts --date $DATE

PUB_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM publications WHERE pub_date = '$DATE'")
PUBLISHED_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM published_articles")
echo ""
echo "✅ Step 5 complete: $PUB_COUNT publication(s), $PUBLISHED_COUNT published article(s)"
echo ""

# Step 6: Export JSON
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 Step 6: Export Website JSON"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx $SCRIPTS_DIR/generate-publication-json.ts --date $DATE
npx tsx $SCRIPTS_DIR/generate-article-json.ts --date $DATE

PUB_JSON_COUNT=$(find public/data/publications -name "*.json" -type f 2>/dev/null | wc -l | xargs)
ARTICLE_JSON_COUNT=$(find public/data/articles -name "*.json" -type f 2>/dev/null | wc -l | xargs)
echo ""
echo "✅ Step 6 complete: $PUB_JSON_COUNT publication JSON(s), $ARTICLE_JSON_COUNT article JSON(s)"
echo ""

# Step 7: Generate Indexes & RSS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 7: Generate Indexes & RSS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx $SCRIPTS_DIR/generate-indexes.ts
npx tsx $SCRIPTS_DIR/generate-rss.ts --limit 50

echo ""
if [ -f "public/data/publications-index.json" ]; then
  echo "✅ publications-index.json created"
fi
if [ -f "public/data/articles-index.json" ]; then
  echo "✅ articles-index.json created"
fi
if [ -f "public/rss.xml" ]; then
  RSS_ITEMS=$(grep -c "<item>" public/rss.xml || echo "0")
  echo "✅ rss.xml created ($RSS_ITEMS items)"
fi
echo ""
echo "✅ Step 7 complete"
echo ""

# Final Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ V3 Pipeline Validation COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Final Database State:"
sqlite3 $DB_PATH "SELECT 
  'Articles' as item, COUNT(*) as count FROM articles
UNION ALL SELECT 'FTS5 Index', COUNT(*) FROM articles_fts
UNION ALL SELECT 'Updates', COUNT(*) FROM article_updates
UNION ALL SELECT 'Publications', COUNT(*) FROM publications
UNION ALL SELECT 'Published Articles', COUNT(*) FROM published_articles" | while read line; do
  echo "   $line"
done
echo ""
echo "📁 Output Files:"
echo "   • public/data/publications/"
echo "   • public/data/articles/"
echo "   • public/data/publications-index.json"
echo "   • public/data/articles-index.json"
echo "   • public/rss.xml"
echo ""
echo "🎉 V3 pipeline validated successfully!"
