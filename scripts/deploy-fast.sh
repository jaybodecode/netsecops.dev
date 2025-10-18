#!/bin/bash

# Super Fast GitHub Pages Deployment
# Assumes: npm run generate already copies CNAME, .nojekyll, README.md

set -e

# Configuration
SOURCE_DIR=".output/public"
TARGET_REPO="jaybodecode/netsecops.github.io"
TEMP_DIR="/tmp/netsecops-fast-deploy"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Super Fast GitHub Pages Deployment${NC}"
echo "========================================"

# Check prerequisites
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: $SOURCE_DIR not found. Run 'npm run generate' first."
    exit 1
fi

# Verify preserved files exist
if [ ! -f "$SOURCE_DIR/CNAME" ]; then
    echo "⚠️  Warning: CNAME not found in build output"
fi

# Copy built files to temp
echo -e "${YELLOW}� Preparing deployment...${NC}"
rm -rf "$TEMP_DIR"
cp -r "$SOURCE_DIR" "$TEMP_DIR"

cd "$TEMP_DIR"

# Initialize git repo
echo -e "${YELLOW}🔧 Initializing git...${NC}"
git init
git branch -M main
git remote add origin "https://github.com/$TARGET_REPO.git"

# Show summary
echo -e "${YELLOW}📊 Deployment summary:${NC}"
echo "  Total files: $(find . -type f ! -path './.git/*' | wc -l)"
[ -f "CNAME" ] && echo -e "  ${GREEN}✅ CNAME${NC}" || echo -e "  ${YELLOW}⚠️  CNAME missing${NC}"
[ -f ".nojekyll" ] && echo -e "  ${GREEN}✅ .nojekyll${NC}" || echo -e "  ${YELLOW}⚠️  .nojekyll missing${NC}"
[ -f "README.md" ] && echo -e "  ${GREEN}✅ README.md${NC}" || echo -e "  ${YELLOW}⚠️  README.md missing${NC}"

# Commit and push
echo -e "${YELLOW}📤 Deploying...${NC}"
git add -A
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Deploy CyberNetSec.io site - $TIMESTAMP"

echo -e "${YELLOW}🚀 Force pushing to GitHub...${NC}"
git push -f origin main

# Cleanup
cd "$OLDPWD"
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Site: https://cyber.netsecops.io${NC}"
