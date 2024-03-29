export type AlertMessage = { title: string; message: string };

export const FEATURE_UNAVAILABLE: AlertMessage = {
  title: "We're still working on this",
  message: "We'll let you know when this feature is ready for you.",
};

export const SOMETHING_WENT_WRONG: AlertMessage = {
  title: 'Something Went Wrong',
  message: "We weren't able to complete your request. Please try again later.",
};

export const DISCARD_CHANGES: AlertMessage = {
  title: 'Discard Changes?',
  message: 'You have unsaved changes. Are you sure you want to discard them?',
};
