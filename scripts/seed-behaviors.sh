#!/bin/bash
# Seed script to populate Appwrite behavior_assets bucket with demo Lottie files
# Updated for macOS compatibility and robust overwriting

BUCKET_ID="behavior_assets"
TEMP_DIR="temp_lottie_seed"

# Ensure we are in a clean state
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "🚀 Starting Nature & Habits seeding (Self-Healing Mode)..."

# Behavior IDs
IDS=("confidence" "sharing" "kindness" "discipline" "less_screen" "calmness" "courage" "honesty" "empathy" "gratitude" "teamwork" "curiosity" "responsibility")

# Verified high-quality direct JSON links from official Lottie test repos
URLS=(
  "https://raw.githubusercontent.com/airbnb/lottie-android/master/sample/src/main/res/raw/lottielogo.json"
  "https://raw.githubusercontent.com/airbnb/lottie-android/master/snapshot-tests/src/main/assets/lottiefiles/socar_logo.json"
  "https://raw.githubusercontent.com/airbnb/lottie-android/master/snapshot-tests/src/main/assets/lottiefiles/animated_logo.json"
  "https://raw.githubusercontent.com/airbnb/lottie-android/master/snapshot-tests/src/main/assets/lottiefiles/swiftkey-logo.json"
  "https://raw.githubusercontent.com/airbnb/lottie-android/master/snapshot-tests/src/main/assets/lottiefiles/xuanwheel_logo.json"
  "https://raw.githubusercontent.com/LottieFiles/test-files/main/data/shapes/bezier.json"
  "https://raw.githubusercontent.com/LottieFiles/test-files/main/data/shapes/ellipse.json"
  "https://raw.githubusercontent.com/LottieFiles/test-files/main/data/shapes/rect.json"
  "https://raw.githubusercontent.com/LottieFiles/test-files/main/data/shapes/star.json"
  "https://raw.githubusercontent.com/LottieFiles/test-files/main/data/layers/image-layer.json"
  "https://raw.githubusercontent.com/LottieFiles/test-files/main/data/layers/image-layer-transform.json"
  "https://raw.githubusercontent.com/airbnb/lottie-android/master/sample/src/main/assets/Lottie%20Logo%201.json"
  "https://raw.githubusercontent.com/airbnb/lottie-android/master/sample/src/main/assets/Lottie%20Logo%202.json"
)

for i in "${!IDS[@]}"; do
  ID="${IDS[$i]}"
  URL="${URLS[$i]}"
  FILE="$TEMP_DIR/$ID.json"
  
  echo "------------------------------------------"
  echo "📥 Downloading [$((i+1))/13]: $ID"
  # Fetch with common User-Agent
  curl -s -L -A "Mozilla/5.0" "$URL" -o "$FILE"
  
  # Basic check to see if it's a JSON file (starts with { or [)
  if [[ $(head -c 1 "$FILE") == "{" || $(head -c 1 "$FILE") == "[" ]]; then
    echo "🗑️ Deleting old entry if exists..."
    appwrite storage delete-file --bucket-id "$BUCKET_ID" --file-id "$ID" > /dev/null 2>&1 || true
    
    echo "📤 Uploading fresh animation to Appwrite ($ID)..."
    appwrite storage create-file --bucket-id "$BUCKET_ID" --file-id "$ID" --file "$FILE"
  else
    echo "❌ Downloaded file for $ID is not valid JSON. Skipping."
    head -n 5 "$FILE" # Show part of the error for debugging
  fi
done

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✨ SEEDING COMPLETE! ✨"
echo "Refresh your app (or restart) to see the beautiful new animations."
