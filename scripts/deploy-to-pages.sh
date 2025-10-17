#!/bin/bash

# CyberNetSec.io GitHub Pages Deployment Script
# Safely deploys .output/public/ to jaybodecode/netsecops.github.io
# while preserving critical files like CNAME and .nojekyll

set -e  # Exit on any error

# Parse arguments
AUTO_CONFIRM=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            AUTO_CONFIRM=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-y|--yes]"
            exit 1
            ;;
    esac
done

# Configuration
SOURCE_DIR=".output/public"
TARGET_REPO="jaybodecode/netsecops.github.io"
TEMP_DIR="/tmp/netsecops-pages-deploy"
PRESERVE_FILES=("CNAME" ".nojekyll" "README.md")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CyberNetSec.io GitHub Pages Deployment${NC}"
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Error: $SOURCE_DIR not found. Run 'npm run generate' first.${NC}"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI (gh) not found.${NC}"
    exit 1
fi

# Check GitHub CLI authentication
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI not authenticated.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"

# Clean up any existing temp directory
if [ -d "$TEMP_DIR" ]; then
    echo -e "${YELLOW}🧹 Cleaning up previous deployment...${NC}"
    rm -rf "$TEMP_DIR"
fi

# Clone target repository
echo -e "${YELLOW}📥 Cloning target repository...${NC}"
gh repo clone "$TARGET_REPO" "$TEMP_DIR" -- --depth 1

# Preserve critical files
echo -e "${YELLOW}💾 Preserving critical files...${NC}"
PRESERVED_DIR="/tmp/preserved-files"
mkdir -p "$PRESERVED_DIR"

for file in "${PRESERVE_FILES[@]}"; do
    if [ -f "$TEMP_DIR/$file" ]; then
        cp "$TEMP_DIR/$file" "$PRESERVED_DIR/"
        echo -e "${GREEN}  ✅ Preserved: $file${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Not found: $file${NC}"
    fi
done

# Clear target directory (except .git)
echo -e "${YELLOW}🗑️  Clearing target directory...${NC}"
cd "$TEMP_DIR"
find . -maxdepth 1 ! -name '.' ! -name '..' ! -name '.git' -exec rm -rf {} +

# Copy new content
echo -e "${YELLOW}📋 Copying new content...${NC}"
cp -r "$OLDPWD/$SOURCE_DIR"/* .

# Restore preserved files
echo -e "${YELLOW}🔄 Restoring preserved files...${NC}"
for file in "${PRESERVE_FILES[@]}"; do
    if [ -f "$PRESERVED_DIR/$file" ]; then
        cp "$PRESERVED_DIR/$file" .
        echo -e "${GREEN}  ✅ Restored: $file${NC}"
    fi
done

# Show what changed
echo -e "${YELLOW}📊 Deployment summary:${NC}"
echo "Files in deployment:"
find . -maxdepth 1 ! -name '.' ! -name '..' ! -name '.git' | wc -l | xargs echo "  Total files:"
echo "  Critical files preserved:"
for file in "${PRESERVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}    ✅ $file${NC}"
    else
        echo -e "${RED}    ❌ $file${NC}"
    fi
done

# Git status
echo -e "${YELLOW}📝 Git status:${NC}"
git add .
if git diff --staged --quiet; then
    echo -e "${GREEN}✅ No changes to deploy${NC}"
    exit 0
else
    echo "Changes to be committed:"
    git diff --staged --name-status | head -20
    if [ $(git diff --staged --name-status | wc -l) -gt 20 ]; then
        echo "... and $(( $(git diff --staged --name-status | wc -l) - 20 )) more files"
    fi
fi

# Confirmation prompt
echo ""
echo -e "${BLUE}🤔 Ready to deploy to $TARGET_REPO${NC}"

if [ "$AUTO_CONFIRM" = true ]; then
    echo -e "${GREEN}✅ Auto-confirming deployment (--yes flag)${NC}"
else
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Deployment cancelled${NC}"
        exit 0
    fi
fi

# Commit and push
echo -e "${YELLOW}📤 Committing and pushing...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Deploy CyberNetSec.io site - $TIMESTAMP"

echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
git push origin main

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
cd "$OLDPWD"
rm -rf "$TEMP_DIR" "$PRESERVED_DIR"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Your site should be available at: https://cyber.netsecops.io${NC}"
echo ""
echo "Deployment completed at: $TIMESTAMP"