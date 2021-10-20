# Changelog

## [Unreleased]

### Added

- Implement basic search functionality (WIP)
  - [x] Search query UI
  - [x] Save search history
  - [x] Ability to search users
  - [ ] Ability to search makers
  - [ ] Ability to search products
  - [ ] Ability to search workshops
  - [ ] Ability to search posts
- Add ability to clear app cache from Settings
- Merge `Vendor`s and `Personal` profiles into one common interface

### Fixed

- Fixed issue where cancelling a search after holding the Explore tab will take
  you to your last viewed tab instead of the Explore feed

## [v2.3.0.3] (2021-10-15)

### Added

- Implement Home tab with dynamically updated content
- Add `LocationQueryBottomSheet` component with basic UI
- Display Parse server URL on the settings page for ease of troubleshooting
- Add basic support for notifications with a `NotificationsScreen` component

### Fixed

- Fix issue where `Slider` in `LocationQueryBottomSheet` doesn't properly
  respond to gesture events on Android

## [v2.3.0.2] (2021-10-06)

### Changed

- Implement Near Me tab (WIP)
- Change Feed bottom tab icon
- General bug fixes

## [v2.3.0.1] (2021-10-05)

### Changed

- New user interface with a modern design
- Migrate project to TypeScript
- Upgrade React Native dependencies

### Added

- New bottom bar tabs:
  - Home tab (WIP)
  - Discover tab (previously Home tab)
  - Notifications tab (previously in drawer)

[unreleased]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.3...HEAD
[v2.3.0.3]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.2...v2.3.0.3
[v2.3.0.2]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.1...v2.3.0.2
[v2.3.0.1]: https://github.com/discovrr-io/discovrr-app/releases/tag/v2.3.0.1
