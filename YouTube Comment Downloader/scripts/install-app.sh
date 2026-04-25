#!/usr/bin/env bash
# install-app.sh
# Compiles YTCommentDownloader.applescript into a .app, injects the ytcomments://
# URL scheme into its Info.plist, and registers it with macOS Launch Services.
#
# Run once after cloning:  bash scripts/install-app.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="YTCommentDownloader"
APPLESCRIPT="$REPO_DIR/app/$APP_NAME.applescript"
INSTALL_DIR="$HOME/Applications"
APP_PATH="$INSTALL_DIR/$APP_NAME.app"
PLIST="$APP_PATH/Contents/Info.plist"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

echo "==> Compiling $APP_NAME.app..."
mkdir -p "$INSTALL_DIR"
osacompile -o "$APP_PATH" "$APPLESCRIPT"

echo "==> Registering ytcomments:// URL scheme..."
# Remove any stale URL type entries first
/usr/libexec/PlistBuddy -c "Delete :CFBundleURLTypes" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string com.jeremybrown.ytcommentdownloader" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string ytcomments" "$PLIST"

echo "==> Registering with Launch Services..."
"$LSREGISTER" -f "$APP_PATH"

echo ""
echo "==> Installing shell script wrapper..."
mkdir -p "$HOME/bin"
cp "$REPO_DIR/scripts/download-comments.sh" "$HOME/bin/download-yt-comments"
chmod +x "$HOME/bin/download-yt-comments"

echo ""
echo "✓ Installed: $APP_PATH"
echo "✓ URL scheme: ytcomments://"
echo "✓ Shell wrapper: ~/bin/download-yt-comments"
echo ""
echo "Test the URL scheme:"
echo "  open 'ytcomments://download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ'"
