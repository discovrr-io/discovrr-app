# Changelog

## [Unreleased]

### Changed

- Polished up `CreateItemPreview` screen
- Implement photo compression and uploading to Firebase Cloud Storage

## [v3.0.0] (2021-10-24)

### Hotfix

- Manually replace all contents of `.env` with `.env.release` for the release
  build
  - This should not have been required but it seems to be an [active issue for
    `react-native-config`](https://github.com/luggit/react-native-config/issues/616)

### Added

- Implement basic search functionality (WIP)
  - [x] Search query UI
  - [x] Save search history
  - [x] Ability to search users
  - [x] Ability to search makers
  - [ ] Ability to search products
  - [ ] Ability to search workshops
  - [ ] Ability to search posts
- Add new experience to create items with preview (WIP)
  - [x] Create text post
  - [x] Create gallery post
  - [ ] Create video post
  - [ ] Create product
  - [ ] Create workshop
- Add ability to clear app cache from Settings
- Add placeholder UI for reporting comments, posts and profiles

### Changed

- Merge `"personal"` and `"vendor"` profile kinds into one common interface
- Change `APP_VERSION` to be set to the node package version, falling back to
  the device version if it could not be found

### Fixed

- Fixed issue where cancelling a search after holding the Explore tab will take
  you to your last viewed tab instead of the Explore feed
- Searching by makers should only bring up makers and not regular users

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

[unreleased]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.0...HEAD
[v3.0.0]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.3...v3.0.0
[v2.3.0.3]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.2...v2.3.0.3
[v2.3.0.2]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.1...v2.3.0.2
[v2.3.0.1]: https://github.com/discovrr-io/discovrr-app/releases/tag/v2.3.0.1
