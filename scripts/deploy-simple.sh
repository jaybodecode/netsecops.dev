#!/bin/bash

# Simplest Possible GitHub Pages Deployment
# Works directly in .output/public - no temp directory needed

set -e

# Configuration
DEPLOY_DIR=".output/public"
TARGET_REPO="jaybodecode/netsecops.github.io"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 GitHub Pages Deployment${NC}"
echo "==========================="

# Check prerequisites
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ Error: $DEPLOY_DIR not found. Run 'npm run generate' first."
    exit 1
fi

cd "$DEPLOY_DIR"

# Verify preserved files
[ -f "CNAME" ] && echo -e "  ${GREEN}✅ CNAME${NC}" || echo -e "  ${YELLOW}⚠️  CNAME missing${NC}"
[ -f ".nojekyll" ] && echo -e "  ${GREEN}✅ .nojekyll${NC}" || echo -e "  ${YELLOW}⚠️  .nojekyll missing${NC}"

# Initialize/reinitialize git
echo -e "${YELLOW}🔧 Initializing git...${NC}"
rm -rf .git
git init
git branch -M main
git remote add origin "https://github.com/$TARGET_REPO.git"

# Show what we're deploying
echo -e "${YELLOW}📊 Files to deploy: $(find . -type f | wc -l)${NC}"

# Commit everything
echo -e "${YELLOW}📤 Committing...${NC}"
git add -A
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Deploy: $TIMESTAMP"

# Push (Git will only upload changes)
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
echo "   (Git will only upload changed files)"
git push -f origin main

cd ../..
echo -e "${GREEN}✅ Deployed!${NC}"
echo -e "${BLUE}🌐 https://cyber.netsecops.io${NC}"
