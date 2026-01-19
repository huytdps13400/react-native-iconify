#!/bin/bash
# 🚀 Quick Publish Script for @huymobile/react-native-iconify
# Version: 1.0.8 → 1.0.9

set -e  # Exit on error

echo "📦 Publishing @huymobile/react-native-iconify v1.0.9"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Are you in the project root?"
  exit 1
fi

# Check git status
echo "🔍 Checking git status..."
if [[ -n $(git status -s) ]]; then
  echo "⚠️  Warning: You have uncommitted changes:"
  git status -s
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check npm login
echo ""
echo "🔐 Checking NPM authentication..."
if ! npm whoami > /dev/null 2>&1; then
  echo "❌ You are not logged in to npm."
  echo "Run: npm login"
  exit 1
fi
echo "✅ Logged in as: $(npm whoami)"

# Clean and build
echo ""
echo "🧹 Cleaning old build..."
npm run clean

echo ""
echo "🔨 Building package..."
npm run build

# Check if build succeeded
if [ ! -d "lib" ]; then
  echo "❌ Build failed - lib/ directory not found"
  exit 1
fi
echo "✅ Build successful"

# Optional: Bundle icons
echo ""
read -p "📦 Do you want to bundle sample icons? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📦 Bundling icons..."
  npm run bundle:force
  echo "✅ Icons bundled"
fi

# Dry run
echo ""
echo "🔍 Preview package contents (dry run)..."
npm pack --dry-run

# Bump version
echo ""
echo "📝 Current version: $(node -p "require('./package.json').version")"
echo ""
echo "Select version bump:"
echo "  1) patch  (1.0.8 → 1.0.9) - Bug fixes"
echo "  2) minor  (1.0.8 → 1.1.0) - New features"
echo "  3) major  (1.0.8 → 2.0.0) - Breaking changes"
echo "  4) custom - Enter version manually"
read -p "Choice (1-4): " choice

case $choice in
  1)
    echo "Bumping patch version..."
    npm version patch -m "chore: release v%s - Metro Bundler & Gradle fixes"
    ;;
  2)
    echo "Bumping minor version..."
    npm version minor -m "chore: release v%s"
    ;;
  3)
    echo "Bumping major version..."
    npm version major -m "chore: release v%s"
    ;;
  4)
    read -p "Enter version (e.g., 1.0.9): " custom_version
    npm version $custom_version -m "chore: release v%s"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ Version bumped to: $NEW_VERSION"

# Confirm publish
echo ""
echo "🚀 Ready to publish @huymobile/react-native-iconify@$NEW_VERSION"
read -p "Continue with publish? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Publish cancelled"
  echo "⚠️  Don't forget to reset version if needed:"
  echo "   git tag -d v$NEW_VERSION"
  echo "   git reset --hard HEAD~1"
  exit 1
fi

# Publish
echo ""
echo "📤 Publishing to npm..."
npm publish --access public

# Push to git
echo ""
echo "✅ Published successfully!"
echo ""
read -p "Push to GitHub? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📤 Pushing to GitHub..."
  git push origin main --follow-tags
  echo "✅ Pushed to GitHub"
fi

# Verify
echo ""
echo "🔍 Verifying published package..."
sleep 3  # Wait for npm to update
npm view @huymobile/react-native-iconify version

echo ""
echo "=================================================="
echo "✅ 🎉 Successfully published v$NEW_VERSION! 🎉"
echo "=================================================="
echo ""
echo "📋 Next steps:"
echo "  1. Create GitHub Release: https://github.com/huytdps13400/react-native-iconify/releases/new"
echo "  2. Check npm page: https://www.npmjs.com/package/@huymobile/react-native-iconify"
echo "  3. Test install: npm install @huymobile/react-native-iconify@latest"
echo ""
