#!/bin/bash
# Backfill Step 2 (news-structured) for each day from October 7 to October 16, 2025
# Run this after completing Step 1 (search-news) for all dates
# Generated on October 16, 2025

echo "🤖 Backfilling structured news (Step 2) from October 7 to October 16, 2025"
echo "================================================================"
echo ""

# October 7 (9 days ago)
echo "📅 October 7, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-07 --logtodb

# October 8 (8 days ago)
echo ""
echo "📅 October 8, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-08 --logtodb

# October 9 (7 days ago)
echo ""
echo "📅 October 9, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-09 --logtodb

# October 10 (6 days ago)
echo ""
echo "📅 October 10, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-10 --logtodb

# October 11 (5 days ago)
echo ""
echo "📅 October 11, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-11 --logtodb

# October 12 (4 days ago)
echo ""
echo "📅 October 12, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-12 --logtodb

# October 13 (3 days ago)
echo ""
echo "📅 October 13, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-13 --logtodb

# October 14 (2 days ago)
echo ""
echo "📅 October 14, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-14 --logtodb

# October 15 (yesterday)
echo ""
echo "📅 October 15, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-15 --logtodb

# October 16 (today)
echo ""
echo "📅 October 16, 2025 - Generating structured content..."
npx tsx scripts/content-generation-v2/news-structured.ts --date 2025-10-16 --logtodb

echo ""
echo "================================================================"
echo "✅ Step 2 backfill complete! Check database for all records:"
echo "   sqlite3 logs/content-generation-v2.db 'SELECT pub_id, pub_date, total_articles FROM structured_news ORDER BY pub_date'"

