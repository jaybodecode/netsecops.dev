#!/bin/bash

# Content Generation V3 Pipeline Runner
# Usage: ./run-pipeline.sh 2025-10-17 [OPTIONS]
#
# By default, starts from Step 3 (skips expensive LLM calls in Steps 1-2)
# Use --start-step 1 or --start-step 2 to run those steps explicitly

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

# Parse arguments
DATE=""
SKIP_STEP_5_5=false
NO_PUBLISH=false
START_STEP=3  # Default: skip Steps 1-2 to avoid accidental expensive LLM calls

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-step-5.5)
      SKIP_STEP_5_5=true
      shift
      ;;
    --start-step)
      START_STEP="$2"
      shift 2
      ;;
    --no-publish)
      NO_PUBLISH=true
      shift
      ;;
    *)
      if [ -z "$DATE" ]; then
        DATE=$1
      else
        print_error "Unknown argument: $1"
        exit 1
      fi
      shift
      ;;
  esac
done

# Validate date argument
if [ -z "$DATE" ]; then
  print_error "Date argument required"
  echo ""
  echo "Usage: $0 YYYY-MM-DD [OPTIONS]"
  echo ""
  echo "Examples:"
  echo "  $0 2025-10-17                      # Start from Step 3 (default)"
  echo "  $0 2025-10-17 --start-step 1       # Start from Step 1 (includes search)"
  echo "  $0 2025-10-17 --start-step 2       # Start from Step 2 (includes structured)"
  echo "  $0 2025-10-17 --skip-step-5.5      # Skip regenerating updated articles"
  echo "  $0 2025-10-17 --no-publish         # Skip build and deploy (Steps 9-10)"
  echo ""
  echo "Options:"
  echo "  --start-step N     Start from step N (default: 3, skips expensive Steps 1-2)"
  echo "  --skip-step-5.5    Skip regenerating updated articles (step 5.5)"
  echo "  --no-publish       Skip build and deployment (steps 9-10)"
  echo ""
  echo "Steps:"
  echo "  1: Search raw news (Google API - costs money)"
  echo "  2: Generate structured content (LLM - costs money)"
  echo "  3: Insert articles + build FTS5 index"
  echo "  4: Detect duplicates"
  echo "  5: Generate publications"
  echo "  5.5: Regenerate updated articles"
  echo "  6: Export website JSON"
  echo "  7: Generate indexes & RSS"
  echo "  8: Generate last updates"
  echo "  9: Build static site"
  echo "  10: Deploy to GitHub Pages"
  exit 1
fi

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
echo "🚀 Starting from: Step $START_STEP"
if [ "$SKIP_STEP_5_5" = true ]; then
  echo "⚠️  Skipping Step 5.5 (regenerate updated articles)"
fi
if [ "$NO_PUBLISH" = true ]; then
  echo "⚠️  Skipping Steps 9-10 (build and deploy)"
fi
echo ""

# Step 1: Search Raw News (optional)
if [ "$START_STEP" -le 1 ]; then
  print_step "🔍 Step 1: Searching raw news..."
  npx tsx $SCRIPTS_DIR/search-news.ts --date $DATE --logtodb
  print_success "Step 1 complete"
  echo ""
else
  print_warning "Skipping Step 1 (search raw news)"
  echo ""
fi

# Step 2: Generate Structured Content (optional)
if [ "$START_STEP" -le 2 ]; then
  print_step "🤖 Step 2: Generating structured content..."
  npx tsx $SCRIPTS_DIR/news-structured.ts --date $DATE --logtodb
  print_success "Step 2 complete"
  echo ""
else
  print_warning "Skipping Step 2 (generate structured content)"
  echo ""
fi

# Step 3: Insert Articles & Build FTS5 Index
if [ "$START_STEP" -le 3 ]; then
  print_step "📥 Step 3: Inserting articles and building FTS5 index..."
  npx tsx $SCRIPTS_DIR/insert-articles.ts --date $DATE
  print_success "Step 3 complete"
  echo ""
fi

# Step 4: Detect Duplicates (V3)
if [ "$START_STEP" -le 4 ]; then
  print_step "🔄 Step 4: Detecting duplicates with FTS5 BM25..."
  npx tsx $SCRIPTS_DIR/check-duplicates-v3.ts --date $DATE
  print_success "Step 4 complete"
  echo ""
fi

# Step 5: Generate Publications
if [ "$START_STEP" -le 5 ]; then
  print_step "📰 Step 5: Generating publications..."
  npx tsx $SCRIPTS_DIR/generate-publication.ts --date $DATE
  print_success "Step 5 complete"
  echo ""
fi

# Step 5.5: Regenerate Updated Article JSON
# Safe to always run - will just show "No updates found" if none exist
if [ "$START_STEP" -le 5 ]; then
  if [ "$SKIP_STEP_5_5" = true ]; then
    print_warning "Step 5.5: Skipping regeneration of updated articles (--skip-step-5.5)"
    echo ""
  else
    print_step "🔄 Step 5.5: Regenerating updated articles..."
    npx tsx $SCRIPTS_DIR/regenerate-updated-articles.ts --date $DATE
    print_success "Step 5.5 complete"
    echo ""
  fi
fi

# Step 6: Export Website JSON
if [ "$START_STEP" -le 6 ]; then
  print_step "📤 Step 6: Exporting website JSON..."
  echo "   → Generating publication JSON..."
  npx tsx $SCRIPTS_DIR/generate-publication-json.ts --date $DATE
  echo "   → Generating article JSON..."
  npx tsx $SCRIPTS_DIR/generate-article-json.ts --date $DATE
  print_success "Step 6 complete"
  echo ""
fi

# Step 7: Generate Indexes & RSS
if [ "$START_STEP" -le 7 ]; then
  print_step "📋 Step 7: Generating indexes and RSS feed..."
  echo "   → Generating indexes..."
  npx tsx $SCRIPTS_DIR/generate-indexes.ts
  echo "   → Generating RSS feed..."
  npx tsx $SCRIPTS_DIR/generate-rss.ts --limit 50
  echo "   → Generating threat level data..."
  npx tsx $SCRIPTS_DIR/generate-threat-level.ts
  print_success "Step 7 complete"
  echo ""
fi

# Step 8: Generate Last Updates
if [ "$START_STEP" -le 8 ]; then
  print_step "🔄 Step 8: Generating last updates..."
  npx tsx $SCRIPTS_DIR/generate-last-updates.ts --date $DATE
  print_success "Step 8 complete"
  echo ""
fi

# Step 9: Build Static Site
if [ "$START_STEP" -le 9 ] && [ "$NO_PUBLISH" = false ]; then
  print_step "🏗️  Step 9: Building static site (npm run generate)..."
  npm run generate
  print_success "Step 9 complete"
  echo ""
elif [ "$NO_PUBLISH" = true ]; then
  print_warning "Skipping Step 9 (build static site) - --no-publish"
  echo ""
fi

# Step 10: Deploy to GitHub Pages
if [ "$START_STEP" -le 10 ] && [ "$NO_PUBLISH" = false ]; then
  print_step "🚀 Step 10: Deploying to GitHub Pages..."
  ./scripts/deploy-to-pages.sh --yes
  print_success "Step 10 complete"
  echo ""
elif [ "$NO_PUBLISH" = true ]; then
  print_warning "Skipping Step 10 (deploy to GitHub Pages) - --no-publish"
  echo ""
fi

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
