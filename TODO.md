# TODO

- [x] Migrate to React Native Navigation v6
  - Currently using React Native Navigation v5
  - Some minor API changes; shouldn't be too difficult to upgrade
- [x] Create an `AsyncGate` component to abstract away the async states of an
      API request
- [x] Create a new `Card` component that can be reused by many components
- [x] Fix _My Profile_ tab to properly navigate to current profile
- [x] Use [branded types][] as `EntityId`s to enforce type checking.
- [x] Migrate `@gorhom/bottom-sheet` package to `^4.0.3`
- [x] Use `ApiFetchStatuses` for other Redux slices
- [x] Clean up Redux slices and API code
- [ ] Add a splash screen for both iOS and Android
- [ ] Add `error` prop to `RouteError` to visually display the error message
- [ ] Fix issue in `ProfileSettingsScreen` where the unsaved changes alert
      still appears even if the form is saved
- [ ] Fix issue where the bottom sheet does not provide enough space for the home
      bar on iOS
- [ ] Refactor API and UI code to separate yarn workspace packages
      (`@discovrr-api` and `@discovrr-ui` )

[branded types]: https://medium.com/@KevinBGreene/surviving-the-typescript-ecosystem-branding-and-type-tagging-6cf6e516523d
