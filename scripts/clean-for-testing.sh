#!/bin/bash
# Clean database and public data for testing Steps 3-5

echo "🗑️  Cleaning for fresh testing run..."

# Backup database
if [ -f logs/content-generation.db ]; then
  cp logs/content-generation.db logs/content-generation.db.backup
  echo "✅ Database backed up to logs/content-generation.db.backup"
fi

# Clear database
rm -f logs/content-generation.db logs/content-generation.db-shm logs/content-generation.db-wal
echo "✅ Database cleared"

# Clear public data
rm -rf public/data/articles/*.json
rm -f public/data/articles-index.json
rm -f public/data/publications-index.json
rm -rf public/data/publications/*.json
echo "✅ Public data cleared"

echo "✅ Ready for fresh pipeline run!"
echo ""
echo "📋 Next steps:"
echo "   1. Run Step 2-5 for one timeframe (e.g., 5daysago)"
echo "   2. Verify output, fix issues"
echo "   3. Re-run this script and test again"
