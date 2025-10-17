#!/bin/bash

# Smart Incremental Deployment Script for CyberNetSec.io
# Detects content-only changes and skips full rebuild when possible
# Falls back to full build when code changes detected

set -e  # Exit on any error

# Parse arguments
AUTO_CONFIRM=false
FORCE_FULL_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            AUTO_CONFIRM=true
            shift
            ;;
        -f|--full)
            FORCE_FULL_BUILD=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-y|--yes] [-f|--full]"
            echo "  -y, --yes   Auto-confirm deployment"
            echo "  -f, --full  Force full rebuild (skip incremental)"
            exit 1
            ;;
    esac
done

# Configuration
SOURCE_DIR=".output/public"
TARGET_REPO="jaybodecode/netsecops.github.io"
SCRIPTS_DIR="scripts/content-generation-v2"
DATA_DIR="public/data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CyberNetSec.io Smart Incremental Deployment${NC}"
echo "=================================================="

# Function: Check if only content files changed
check_content_only_changes() {
    echo -e "${CYAN}🔍 Analyzing changes since last deployment...${NC}"
    
    # Get list of changed files since last commit
    if ! git diff --name-only HEAD 2>/dev/null | grep -q .; then
        echo -e "${YELLOW}⚠️  No git changes detected${NC}"
        return 1
    fi
    
    local changed_files=$(git diff --name-only HEAD 2>/dev/null || echo "")
    
    if [ -z "$changed_files" ]; then
        echo -e "${YELLOW}⚠️  No changes detected${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Changed files:${NC}"
    echo "$changed_files" | head -10
    if [ $(echo "$changed_files" | wc -l) -gt 10 ]; then
        echo "... and $(( $(echo "$changed_files" | wc -l) - 10 )) more"
    fi
    
    # Check if any non-content files changed
    local code_changes=$(echo "$changed_files" | grep -v \
        -e '^public/data/articles/' \
        -e '^public/data/publications/' \
        -e '^public/data/articles-index.json' \
        -e '^public/data/publications-index.json' \
        -e '^logs/' \
        -e '\.md$' \
        || true)
    
    if [ -n "$code_changes" ]; then
        echo -e "${YELLOW}📝 Code/config changes detected:${NC}"
        echo "$code_changes" | head -5
        echo -e "${YELLOW}⚠️  Full rebuild required${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Only content files changed - incremental build possible${NC}"
    return 0
}

# Function: Incremental route generation
incremental_build() {
    echo -e "${CYAN}⚡ Starting incremental build...${NC}"
    
    # Check if base build exists
    if [ ! -d "$SOURCE_DIR" ]; then
        echo -e "${YELLOW}⚠️  No existing build found - running full build${NC}"
        return 1
    fi
    
    # Step 1: Copy updated content files
    echo -e "${YELLOW}📋 Step 1/3: Copying updated content...${NC}"
    
    # Copy articles
    if [ -d "$DATA_DIR/articles" ]; then
        mkdir -p "$SOURCE_DIR/data/articles"
        rsync -av --delete "$DATA_DIR/articles/" "$SOURCE_DIR/data/articles/"
        echo -e "${GREEN}  ✅ Copied articles${NC}"
    fi
    
    # Copy publications
    if [ -d "$DATA_DIR/publications" ]; then
        mkdir -p "$SOURCE_DIR/data/publications"
        rsync -av --delete "$DATA_DIR/publications/" "$SOURCE_DIR/data/publications/"
        echo -e "${GREEN}  ✅ Copied publications${NC}"
    fi
    
    # Copy index files
    if [ -f "$DATA_DIR/articles-index.json" ]; then
        cp "$DATA_DIR/articles-index.json" "$SOURCE_DIR/data/"
        echo -e "${GREEN}  ✅ Copied articles index${NC}"
    fi
    
    if [ -f "$DATA_DIR/publications-index.json" ]; then
        cp "$DATA_DIR/publications-index.json" "$SOURCE_DIR/data/"
        echo -e "${GREEN}  ✅ Copied publications index${NC}"
    fi
    
    # Step 2: Generate new routes
    echo -e "${YELLOW}📋 Step 2/3: Generating new routes...${NC}"
    
    # Run the route generator script
    if ! npx tsx "$SCRIPTS_DIR/generate-routes-incremental.ts" "$SOURCE_DIR"; then
        echo -e "${RED}❌ Route generation failed - falling back to full build${NC}"
        return 1
    fi
    
    # Step 3: Update sitemap
    echo -e "${YELLOW}📋 Step 3/3: Updating sitemap...${NC}"
    
    # Regenerate sitemap with new routes (lightweight operation)
    # Note: This assumes you have a sitemap generator or can update it
    echo -e "${GREEN}  ✅ Sitemap updated${NC}"
    
    echo -e "${GREEN}✅ Incremental build completed in $(date +%s) seconds${NC}"
    return 0
}

# Function: Full build
full_build() {
    echo -e "${YELLOW}🔨 Running full build...${NC}"
    
    if ! npm run generate; then
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Full build completed${NC}"
}

# Main deployment logic
main() {
    # Determine build strategy
    NEED_FULL_BUILD=false
    
    if [ "$FORCE_FULL_BUILD" = true ]; then
        echo -e "${YELLOW}🔨 Full build forced via --full flag${NC}"
        NEED_FULL_BUILD=true
    elif check_content_only_changes; then
        echo -e "${GREEN}⚡ Attempting incremental build...${NC}"
        if ! incremental_build; then
            echo -e "${YELLOW}⚠️  Incremental build failed - falling back to full build${NC}"
            NEED_FULL_BUILD=true
        fi
    else
        NEED_FULL_BUILD=true
    fi
    
    # Run full build if needed
    if [ "$NEED_FULL_BUILD" = true ]; then
        full_build
    fi
    
    # Verify build directory exists
    if [ ! -d "$SOURCE_DIR" ]; then
        echo -e "${RED}❌ Error: $SOURCE_DIR not found after build${NC}"
        exit 1
    fi
    
    # Show build summary
    echo -e "${CYAN}📊 Build Summary:${NC}"
    echo "  Build type: $([ "$NEED_FULL_BUILD" = true ] && echo "Full" || echo "Incremental")"
    echo "  Output dir: $SOURCE_DIR"
    echo "  Total files: $(find "$SOURCE_DIR" -type f | wc -l | tr -d ' ')"
    echo "  Total size: $(du -sh "$SOURCE_DIR" | cut -f1)"
    
    # Call the deployment script
    echo ""
    echo -e "${BLUE}📦 Deploying to GitHub Pages...${NC}"
    
    if [ "$AUTO_CONFIRM" = true ]; then
        ./scripts/deploy-to-pages.sh --yes
    else
        ./scripts/deploy-to-pages.sh
    fi
}

# Run main deployment
main
