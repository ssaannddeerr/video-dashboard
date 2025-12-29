#!/bin/bash
# Ad-hoc code signing for macOS app
# This prevents the "damaged" error without requiring an Apple Developer ID
# Users will still need to right-click → Open on first launch

set -e

APP_PATH="$1"

if [ -z "$APP_PATH" ]; then
  echo "Usage: $0 <path-to-app>"
  exit 1
fi

if [ ! -d "$APP_PATH" ]; then
  echo "Error: App not found at $APP_PATH"
  exit 1
fi

echo "========================================="
echo "Ad-hoc Code Signing macOS App"
echo "========================================="
echo "App: $APP_PATH"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "⚠️  Warning: Not running on macOS - skipping code signing"
  echo "   (This is expected when building on Linux/Windows)"
  exit 0
fi

# Ad-hoc sign the app (no identity, just prevents "damaged" error)
echo "Signing app with ad-hoc signature..."
codesign --force --deep --sign - "$APP_PATH"

if [ $? -eq 0 ]; then
  echo "✓ App signed successfully"
  echo ""
  echo "Note: This is an ad-hoc signature."
  echo "Users will still need to right-click → Open on first launch."
  echo "For a seamless experience, use an Apple Developer ID certificate."
else
  echo "✗ Signing failed"
  exit 1
fi

# Verify the signature
echo ""
echo "Verifying signature..."
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

if [ $? -eq 0 ]; then
  echo "✓ Signature verified"
else
  echo "⚠️  Signature verification failed (app may still work)"
fi

echo ""
echo "========================================="
echo "Signing complete!"
echo "========================================="
