# Changelog

## [Unreleased]

## [v3.2.0] (2021-12-05)

### Changed

- Removed authentication screens from initial flow
  - Users don't need to be signed in when they open the app
  - The app will redirect users to an authentication prompt when required
- Disabled font scaling for some areas of the app (e.g. navigation headers)
- Updated global UI colours

## [v3.1.0] (2021-11-30)

### Added

- Dark mode (can be configured to follow system's scheme or manually set)
  - Authentication screen still retains light theme for now
- Display modal when current app version is not supported anymore
- Mentions now show up as interactive links on post item cards and on the post
  details screen
- Add ability to like products
- Add search icon on home tab header
- Display number of replies on post item cards

### Fixed

- App-wide font scaling should now be capped at a certain scale when
  accessibility font size is very large ([issue #11])
- Discovrr logo icon font file now displays correctly on Android

## [v3.0.9] (2021-11-25)

### Added

- Ability to navigate to user profile by mentions (`@username`)
- Add a `__publicName` property in the `Profile` model for convenience

### Changed

- Add an "Explore our makers" section in the landing screen
- Fetch profile whenever the app drawer is open
- Persist only whitelisted reducers with `redux-persist`
- Change CodePush install mode to `ON_NEXT_SUSPEND`

## [v3.0.8] (2021-11-22)

### Changed

- Redesigned landing page
- Display prompt for push notifications after the onboarding process

### Fixed

- Display business names instead of display names for vendor profiles

## [v3.0.7] (2021-11-21)

### Changed

- Remove OneSignal integration
- Integrate Firebase messaging extension for iOS
- Finalise deep linking and notification link support
- Generate a thumbnail when uploading a video for profile background

## [v3.0.6] (2021-11-21)

### Added

- Change profile background (images and video)
  - Uploading video with camera isn't available yet
- Implement notification screen with basic history and deep linking

### Changed

- Configure Redux to store post IDs from the Discover feed on a separate Redux
  slice to keep posts sorted and to avoid posts jumping around when refreshing
- Display labels under the tab icons on the bottom tab bar

### Fixed

- Products and maker profiles in Near Me should now be properly shuffled

## [v3.0.5] (2021-11-17)

### Added

- Replace video on login screen with a new splash video
- New profile details page with taller header
  - [x] Display products on maker profile page
  - [x] Show profile name on top when bottom sheet covers header
  - [x] Replace old profile page on My Profile tab with new one
- Add new onboarding process (WIP)

### Changed

- Increase maximum username limit to 30 characters
- Increase product name limit to 150 characters
- Increase product description limit to 2000 characters
- Allow full stops in profile username and disallow only repeated symbols
- Revamped profile details screen with new UI and video header

## [v3.0.4] (2021-11-10)

### Added

- Add ability to compress and upload video posts with boomerang GIF preview
- Display a video player on `PostDetailsScreen` for video posts
- Add ability to share feedback via email
- Add ability to publish products and its images from verified vendors onto
  Squarespace

### Changed

- Show statistics and actions on maker profile pages

### Fixed

- Fix issue where creating a new account with email and password failed
- Minor bug fixes and visual changes

## [v3.0.3] (2021-11-06)

### Changed

- Enable Hermes for Android
- Downgrade `fresco` native library to version `2.2.0`

## [v3.0.2] (2021-11-05)

### Added

- Add ability to switch account type from `"personal"` to `"vendor"` and
  vice-versa
- Add ability to create products
- Add basic functionality to create video posts

### Changed

- Display alert informing unsaved changes when navigation away from dirty forms

### Fixed

- Fix issue where the "Sign in with Google" button doesn't show the account
  selection dialog after already signing into another Google account previously
  ([issue #6])

## [v3.0.1] (2021-10-30)

### Added

- Add ability to change profile picture
- Add ability to create gallery posts

### Changed

- Polish up `CreateItemPreview` screen
- Compress photos when uploading to Firebase Cloud Storage

## [v3.0.0] (2021-10-24)

### Hotfix

- Manually replace all contents of `.env` with `.env.release` for the release
  build
  - This should not have been required but it seems to be an [active issue for
    `react-native-config`](https://github.com/luggit/react-native-config/issues/616)

### Fixed

- Fix issue where cancelling a search after holding the Explore tab will take
  you to your last viewed tab instead of the Explore feed
- Searching by makers should only bring up makers and not regular users

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
  - [x] Create text posts
  - [x] Create gallery posts (2021-10-30)
  - [x] Create video posts (2021-11-10)
  - [x] Create products (2021-11-05)
  - [ ] Create workshops
- Add ability to clear app cache from Settings
- Add placeholder UI for reporting comments, posts and profiles

### Changed

- Merge `"personal"` and `"vendor"` profile kinds into one common interface
- Change `APP_VERSION` to be set to the node package version, falling back to
  the device version if it could not be found

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

### Added

- New bottom bar tabs:
  - Home tab (WIP)
  - Discover tab (previously Home tab)
  - Notifications tab (previously in drawer)

### Changed

- New user interface with a modern design
- Migrate project to TypeScript
- Upgrade React Native dependencies

<!-- Issues -->

[issue #6]: https://github.com/discovrr-io/discovrr-app/issues/6
[issue #11]: https://github.com/discovrr-io/discovrr-app/issues/11

<!-- Releases -->

[unreleased]: https://github.com/discovrr-io/discovrr-app/compare/v3.2.0...HEAD
[v3.2.0]: https://github.com/discovrr-io/discovrr-app/compare/v3.1.0...v3.2.0
[v3.1.0]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.9...v3.1.0
[v3.0.9]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.8...v3.0.9
[v3.0.8]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.7...v3.0.8
[v3.0.7]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.6...v3.0.7
[v3.0.6]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.5...v3.0.6
[v3.0.5]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.4...v3.0.5
[v3.0.4]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.3...v3.0.4
[v3.0.3]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.2...v3.0.3
[v3.0.2]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.1...v3.0.2
[v3.0.1]: https://github.com/discovrr-io/discovrr-app/compare/v3.0.0...v3.0.1
[v3.0.0]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.3...v3.0.0
[v2.3.0.3]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.2...v2.3.0.3
[v2.3.0.2]: https://github.com/discovrr-io/discovrr-app/compare/v2.3.0.1...v2.3.0.2
[v2.3.0.1]: https://github.com/discovrr-io/discovrr-app/releases/tag/v2.3.0.1
