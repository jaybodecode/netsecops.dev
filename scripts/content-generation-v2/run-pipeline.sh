#!/bin/bash

# Content Generation V3 Pipeline Runner
# Usage: ./run-pipeline.sh 2025-10-17

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Error handling trap
trap 'handle_error $? $LINENO' ERR

handle_error() {
  local exit_code=$1
  local line_number=$2
  echo ""
  print_error "Script failed at line $line_number with exit code $exit_code"
  echo ""
  echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
  echo "   1. Check the error message above"
  echo "   2. Verify the database exists: ls -lh logs/content-generation-v2.db"
  echo "   3. Check if previous steps completed successfully"
  echo "   4. Review logs in tmp/ directory"
  echo ""
  exit $exit_code
}

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_error() {
  echo -e "${RED}❌ ERROR: $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Validate date argument
if [ -z "$1" ]; then
  print_error "Date argument required"
  echo ""
  echo "Usage: $0 YYYY-MM-DD"
  echo "Example: $0 2025-10-17"
  exit 1
fi

DATE=$1

# Validate date format (YYYY-MM-DD)
if ! [[ $DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  print_error "Invalid date format. Expected YYYY-MM-DD, got: $DATE"
  exit 1
fi

# Validate date is valid (e.g., not 2025-13-45)
if ! date -j -f "%Y-%m-%d" "$DATE" > /dev/null 2>&1; then
  print_error "Invalid date: $DATE"
  exit 1
fi

# Configuration
SCRIPTS_DIR="scripts/content-generation-v2"

echo ""
print_step "📰 Content Generation V3 Pipeline"
echo "📅 Processing date: $DATE"
echo ""

# Step 1: Search Raw News
print_step "🔍 Step 1: Searching raw news..."
npx tsx $SCRIPTS_DIR/search-news.ts --date $DATE --logtodb
print_success "Step 1 complete"
echo ""

# Step 2: Generate Structured Content
print_step "🤖 Step 2: Generating structured content..."
npx tsx $SCRIPTS_DIR/news-structured.ts --date $DATE --logtodb
print_success "Step 2 complete"
echo ""

# Step 3: Insert Articles & Build FTS5 Index
print_step "📥 Step 3: Inserting articles and building FTS5 index..."
npx tsx $SCRIPTS_DIR/insert-articles.ts --date $DATE
print_success "Step 3 complete"
echo ""

# Step 4: Detect Duplicates (V3)
print_step "🔄 Step 4: Detecting duplicates with FTS5 BM25..."
npx tsx $SCRIPTS_DIR/check-duplicates-v3.ts --date $DATE
print_success "Step 4 complete"
echo ""

# Step 5: Generate Publications
print_step "📰 Step 5: Generating publications..."
npx tsx $SCRIPTS_DIR/generate-publication.ts --date $DATE
print_success "Step 5 complete"
echo ""

# Step 5.5: Regenerate Updated Article JSON
# Safe to always run - will just show "No updates found" if none exist
print_step "🔄 Step 5.5: Regenerating updated articles..."
npx tsx $SCRIPTS_DIR/regenerate-updated-articles.ts --date $DATE
print_success "Step 5.5 complete"
echo ""

# Step 6: Export Website JSON
print_step "📤 Step 6: Exporting website JSON..."
echo "   → Generating publication JSON..."
npx tsx $SCRIPTS_DIR/generate-publication-json.ts --date $DATE
echo "   → Generating article JSON..."
npx tsx $SCRIPTS_DIR/generate-article-json.ts --date $DATE
print_success "Step 6 complete"
echo ""

# Step 7: Generate Indexes & RSS
print_step "📋 Step 7: Generating indexes and RSS feed..."
echo "   → Generating indexes..."
npx tsx $SCRIPTS_DIR/generate-indexes.ts
echo "   → Generating RSS feed..."
npx tsx $SCRIPTS_DIR/generate-rss.ts --limit 50
print_success "Step 7 complete"
echo ""

# Step 8: Generate Last Updates
print_step "🔄 Step 8: Generating last updates..."
npx tsx $SCRIPTS_DIR/generate-last-updates.ts
print_success "Step 8 complete"
echo ""

# Step 9: Build Static Site
print_step "🏗️  Step 9: Building static site (npm run generate)..."
npm run generate
print_success "Step 9 complete"
echo ""

# Step 10: Deploy to GitHub Pages
print_step "🚀 Step 10: Deploying to GitHub Pages..."
./scripts/deploy-to-pages.sh --yes
print_success "Step 10 complete"
echo ""

# Final summary
print_step "✨ Pipeline Complete!"
echo ""
echo "📊 Statistics for $DATE:"
echo ""

# Show resolution statistics
if command -v sqlite3 &> /dev/null; then
  sqlite3 logs/content-generation-v2.db <<EOF
.mode column
.headers on
SELECT 
  resolution, 
  COUNT(*) as count 
FROM articles 
WHERE date(created_at) = '$DATE'
GROUP BY resolution;
EOF
else
  print_warning "sqlite3 not found, skipping statistics"
fi

echo ""
print_success "All steps completed successfully for $DATE"
echo ""
