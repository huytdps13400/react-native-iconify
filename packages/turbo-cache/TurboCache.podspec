require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'TurboCache'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage'] || 'https://github.com/huykhuong/react-native-iconify'
  s.platforms      = {
    :ios => '13.0'
  }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/huykhuong/react-native-iconify.git' }
  s.static_framework = true

  # Dependencies
  s.dependency 'ExpoModulesCore'
  s.dependency 'SDWebImage', '~> 5.21.0'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  # Source files
  s.source_files = "ios/**/*.{h,m,swift}"
end
