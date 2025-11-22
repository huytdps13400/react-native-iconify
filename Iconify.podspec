require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Iconify"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => ".git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"

  s.dependency "React-Core"
  s.dependency "SDWebImage", "~> 5.21.0"

  # Support both architectures
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = "-DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig = {
      "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
      "DEFINES_MODULE" => "YES"
    }
  else
    s.pod_target_xcconfig = {
      "DEFINES_MODULE" => "YES"
    }
  end

  # ==========================================================================
  # Iconify Auto-Bundling for Production Builds (iOS)
  # ==========================================================================
  # This script phase runs before compilation to bundle icons for release builds.
  s.script_phase = {
    :name => 'Bundle Iconify Icons',
    :script => <<-SCRIPT,
#!/bin/bash
set -e

# Only run for Release builds
if [ "$CONFIGURATION" != "Release" ]; then
  echo "[Iconify] Skipping icon bundling for $CONFIGURATION build"
  exit 0
fi

echo ""
echo "🎨 [Iconify] Bundling icons for production build..."
echo ""

# Find the bundling script
SCRIPT_PATH=""
POSSIBLE_PATHS=(
  "${PODS_ROOT}/../node_modules/react-native-iconify/scripts/bundle-production.js"
  "${SRCROOT}/../node_modules/react-native-iconify/scripts/bundle-production.js"
  "${SRCROOT}/node_modules/react-native-iconify/scripts/bundle-production.js"
)

for path in "${POSSIBLE_PATHS[@]}"; do
  if [ -f "$path" ]; then
    SCRIPT_PATH="$path"
    break
  fi
done

if [ -z "$SCRIPT_PATH" ]; then
  echo "⚠️ [Iconify] Could not find bundling script. Icons will be loaded from API."
  exit 0
fi

# Find node binary
NODE_BINARY=""
if [ -x "$(command -v node)" ]; then
  NODE_BINARY="node"
elif [ -x "/usr/local/bin/node" ]; then
  NODE_BINARY="/usr/local/bin/node"
elif [ -x "/opt/homebrew/bin/node" ]; then
  NODE_BINARY="/opt/homebrew/bin/node"
elif [ -x "$HOME/.nvm/current/bin/node" ]; then
  NODE_BINARY="$HOME/.nvm/current/bin/node"
else
  echo "⚠️ [Iconify] Could not find node binary. Icons will be loaded from API."
  exit 0
fi

# Run bundling script from project root
cd "${SRCROOT}/.."
"$NODE_BINARY" "$SCRIPT_PATH" || {
  echo ""
  echo "⚠️ [Iconify] Icon bundling failed. Icons will be loaded from API at runtime."
  echo ""
  exit 0
}

echo ""
echo "✅ [Iconify] Icon bundling complete!"
echo ""
SCRIPT
    :execution_position => :before_compile,
    :shell_path => '/bin/bash'
  }

  install_modules_dependencies(s)
end
