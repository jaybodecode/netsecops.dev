#!/bin/bash

# Copy Category Images Script
# Maps sample imagen files to category image names

echo "🎨 Copying Category Images"
echo "========================================"

SAMPLES_DIR="/Users/admin/Social-Poster/samples"
TARGET_DIR="/Users/admin/Social-Poster/new-site/public/images/categories"

# Create target directory
mkdir -p "$TARGET_DIR"

# Get all imagen PNG files (excluding copies)
IMAGES=($(ls "$SAMPLES_DIR"/imagen_*.png | grep -v "copy"))

# Total images available
TOTAL_IMAGES=${#IMAGES[@]}
echo "📸 Found $TOTAL_IMAGES sample images"

# Categories to create
declare -a CATEGORIES=(
  "malware.png"
  "threat-actor.png"
  "vulnerability.png"
  "data-breach.png"
  "threat-briefing.png"
  "ransomware.png"
  "phishing.png"
  "supply-chain.png"
  "zero-day.png"
  "cyberattack.png"
  "campaign.png"
  "insider-threat.png"
  "iot-security.png"
  "cloud-security.png"
  "network-security.png"
  "endpoint-security.png"
  "incident-response.png"
  "compliance.png"
  "emerging-threats.png"
  "cybersecurity-awareness.png"
  "digital-forensics.png"
  "cryptocurrency.png"
  "ai-security.png"
  "mobile-security.png"
  "web-security.png"
  "ics-security.png"
  "other.png"
)

TOTAL_CATEGORIES=${#CATEGORIES[@]}
echo "📁 Mapping to $TOTAL_CATEGORIES categories"
echo ""

# Copy images in round-robin fashion
SUCCESS=0
for i in "${!CATEGORIES[@]}"; do
  CATEGORY="${CATEGORIES[$i]}"
  IMAGE_INDEX=$((i % TOTAL_IMAGES))
  SOURCE_IMAGE="${IMAGES[$IMAGE_INDEX]}"
  
  if [ -f "$SOURCE_IMAGE" ]; then
    cp "$SOURCE_IMAGE" "$TARGET_DIR/$CATEGORY"
    echo "  ✅ $CATEGORY"
    ((SUCCESS++))
  else
    echo "  ❌ $CATEGORY (source not found)"
  fi
done

echo ""
echo "========================================"
echo "✨ Copy Complete!"
echo ""
echo "  ✅ Successful: $SUCCESS"
echo "  📊 Total: $TOTAL_CATEGORIES"
echo ""
echo "📁 Target: $TARGET_DIR"
echo ""
