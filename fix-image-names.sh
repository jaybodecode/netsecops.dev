#!/bin/bash
# Fix Image Naming to Match LLM-Generated Categories and Publication Types

echo "🖼️  Fixing image names to match schema enums..."
echo ""

# Categories
echo "📁 Fixing category images..."

if [ -f "public/images/categories/supply-chain.png" ]; then
  echo "  Renaming: supply-chain.png → supply-chain-attack.png"
  mv public/images/categories/supply-chain.png public/images/categories/supply-chain-attack.png
  echo "  ✅ Renamed"
else
  echo "  ⚠️  supply-chain.png already renamed or doesn't exist"
fi

echo "  Creating symlink: ics-security.png → industrial-control-systems.png"
cd public/images/categories/
if [ -f "ics-security.png" ]; then
  ln -sf ics-security.png industrial-control-systems.png
  echo "  ✅ Symlink created"
else
  echo "  ⚠️  ics-security.png not found"
fi
cd ../../..

echo ""
echo "📰 Fixing publication type images..."

# Daily
if [ -f "public/images/publications/daily-update.png" ]; then
  echo "  Renaming: daily-update.png → daily.png"
  mv public/images/publications/daily-update.png public/images/publications/daily.png
  echo "  ✅ Renamed"
elif [ ! -f "public/images/publications/daily.png" ]; then
  echo "  ⚠️  daily-update.png doesn't exist, need to create daily.png"
else
  echo "  ✓ daily.png already exists"
fi

# Weekly
if [ -f "public/images/publications/weekly-digest.png" ]; then
  echo "  Renaming: weekly-digest.png → weekly.png"
  mv public/images/publications/weekly-digest.png public/images/publications/weekly.png
  echo "  ✅ Renamed"
elif [ ! -f "public/images/publications/weekly.png" ]; then
  echo "  ⚠️  weekly-digest.png doesn't exist, need to create weekly.png"
else
  echo "  ✓ weekly.png already exists"
fi

# Monthly
if [ -f "public/images/publications/monthly-roundup.png" ]; then
  echo "  Renaming: monthly-roundup.png → monthly.png"
  mv public/images/publications/monthly-roundup.png public/images/publications/monthly.png
  echo "  ✅ Renamed"
elif [ ! -f "public/images/publications/monthly.png" ]; then
  echo "  ⚠️  monthly-roundup.png doesn't exist, need to create monthly.png"
else
  echo "  ✓ monthly.png already exists"
fi

echo ""
echo "🎯 Verification..."
echo ""
echo "Category images that match enum:"
ls -1 public/images/categories/ 2>/dev/null | grep -E '^(ransomware|malware|threat-actor|vulnerability|data-breach|phishing|supply-chain-attack|cyberattack|industrial-control-systems|cloud-security|mobile-security|iot-security|other)\.png$' | sort

echo ""
echo "Publication type images that match enum:"
ls -1 public/images/publications/ 2>/dev/null | grep -E '^(daily|weekly|monthly)\.png$' | sort

echo ""
echo "All publication images:"
ls -1 public/images/publications/ 2>/dev/null

echo ""
echo "✅ Image renaming complete!"
