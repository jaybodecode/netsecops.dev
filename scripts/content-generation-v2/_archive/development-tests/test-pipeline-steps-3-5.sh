#!/bin/bash
# Content Generation V2 - Pipeline Test (Steps 3-5)
# End-to-end test using existing data

set -e  # Exit on error

# Parse arguments
DATE=""
SKIP_INDEX=false
THRESHOLD=0.70
LOOKBACK=30

while [[ $# -gt 0 ]]; do
  case $1 in
    --date)
      DATE="$2"
      shift 2
      ;;
    --skip-index)
      SKIP_INDEX=true
      shift
      ;;
    --threshold)
      THRESHOLD="$2"
      shift 2
      ;;
    --lookback-days)
      LOOKBACK="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -z "$DATE" ]; then
  echo "❌ Error: --date is required"
  echo "Usage: ./test-pipeline-steps-3-5.sh --date 2025-10-09 [--skip-index] [--threshold 0.70] [--lookback-days 30]"
  exit 1
fi

echo "🧪 Content Generation V2 - Pipeline Test (Steps 3-5)"
echo ""
echo "📋 Test Configuration:"
echo "   Target Date: $DATE"
echo "   Skip Indexing: $SKIP_INDEX"
echo "   Threshold: $THRESHOLD"
echo "   Lookback: $LOOKBACK days"
echo ""

START_TIME=$(date +%s)

# Step 3: Index entities
if [ "$SKIP_INDEX" = false ]; then
  echo "======================================================================"
  echo "📊 STEP 3: Index Entities"
  echo "======================================================================"
  echo ""
  npx tsx scripts/content-generation-v2/index-entities.ts --date $DATE --force
  echo ""
  echo "✅ STEP 3 complete"
  echo ""
else
  echo "======================================================================"
  echo "📊 STEP 3: Index Entities"
  echo "======================================================================"
  echo ""
  echo "⏭️  Skipped (--skip-index flag)"
  echo ""
fi

# Step 4: Duplicate detection
echo "======================================================================"
echo "🔍 STEP 4: Detect Duplicates"
echo "======================================================================"
echo ""
npx tsx scripts/content-generation-v2/check-duplicates.ts --date $DATE --threshold $THRESHOLD --lookback-days $LOOKBACK
echo ""
echo "✅ STEP 4 complete"
echo ""

# Step 5: Resolve with LLM
echo "======================================================================"
echo "🤖 STEP 5: Resolve with LLM"
echo "======================================================================"
echo ""
npx tsx scripts/content-generation-v2/resolve-duplicates.ts --date $DATE --threshold $THRESHOLD --lookback-days $LOOKBACK
echo ""
echo "✅ STEP 5 complete"
echo ""

# Summary
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "======================================================================"
echo "✅ PIPELINE TEST COMPLETE"
echo "======================================================================"
echo ""
echo "📊 Summary:"
echo "   Date tested: $DATE"
echo "   Duration: ${DURATION}s"
if [ "$SKIP_INDEX" = true ]; then
  echo "   Steps: 4-5"
else
  echo "   Steps: 3-5"
fi
echo ""
echo "💡 Next Steps:"
echo "   1. Review LLM decisions above"
echo "   2. Validate UPDATE classifications"
echo "   3. Check BORDERLINE resolutions"
echo "   4. Test with different dates (Oct 7, 10, 12)"
echo ""
