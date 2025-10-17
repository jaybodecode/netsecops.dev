#!/bin/bash
# Quick daily content update and deployment script

DATE=$(date +%Y-%m-%d)

echo "🚀 Daily Content Update - $DATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Generate content
echo "📝 Running content pipeline..."
if ! ./scripts/content-generation-v2/run-pipeline.sh $DATE; then
    echo "❌ Content pipeline failed"
    exit 1
fi

# Step 2: Deploy incrementally
echo ""
echo "🚀 Deploying to production..."
if ! ./scripts/deploy-daily-incremental.sh -y; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "✅ Daily update completed!"
echo "🌐 Site: https://cyber.netsecops.io"
