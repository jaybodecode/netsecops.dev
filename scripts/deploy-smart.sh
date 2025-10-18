#!/bin/bash

# Smart GitHub Pages Deployment
# Preserves .git folder across builds for faster incremental pushes

set -e

# Configuration
DEPLOY_DIR=".output/public"
GIT_BACKUP="/tmp/netsecops-git-backup"
TARGET_REPO="jaybodecode/netsecops.github.io"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Smart GitHub Pages Deployment${NC}"
echo "==================================="

# Check prerequisites
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ Error: $DEPLOY_DIR not found. Run 'npm run generate' first."
    exit 1
fi

cd "$DEPLOY_DIR"

# Check if we have a .git folder already
if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Found existing .git - will push incrementally${NC}"
    INCREMENTAL=true
else
    echo -e "${YELLOW}⚠️  No .git found - first time setup${NC}"
    INCREMENTAL=false
    
    # Initialize git
    git init
    git branch -M main
    git remote add origin "https://github.com/$TARGET_REPO.git"
fi

# Verify preserved files
[ -f "CNAME" ] && echo -e "  ${GREEN}✅ CNAME${NC}" || echo -e "  ${YELLOW}⚠️  CNAME missing${NC}"
[ -f ".nojekyll" ] && echo -e "  ${GREEN}✅ .nojekyll${NC}" || echo -e "  ${YELLOW}⚠️  .nojekyll missing${NC}"

# Show what changed
echo -e "${YELLOW}📊 Git status:${NC}"
git add -A

if git diff --cached --quiet; then
    echo -e "${GREEN}✅ No changes to deploy${NC}"
    cd ../..
    exit 0
fi

# Show changed files count
CHANGED=$(git diff --cached --name-only | wc -l | xargs)
echo -e "  Changed/new files: ${CHANGED}"

if [ "$INCREMENTAL" = true ]; then
    echo -e "${GREEN}🚀 Incremental push - Git will only upload ${CHANGED} changed files${NC}"
else
    echo -e "${YELLOW}📤 First push - uploading all files${NC}"
fi

# Commit
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Deploy: $TIMESTAMP"

# Push (force for first time, normal for incremental)
if [ "$INCREMENTAL" = true ]; then
    echo -e "${YELLOW}🚀 Pushing changes...${NC}"
    git push origin main
else
    echo -e "${YELLOW}🚀 Force pushing (first time)...${NC}"
    git push -f origin main
fi

cd ../..
echo -e "${GREEN}✅ Deployed!${NC}"
echo -e "${BLUE}🌐 https://cyber.netsecops.io${NC}"
