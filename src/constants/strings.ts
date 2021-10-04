export type AlertMessage = { title: string; message: string };

export const FEATURE_UNAVAILABLE: AlertMessage = {
  title: "We're still working on this!",
  message: "We'll let you know when this feature is ready for you.",
};

export const SOMETHING_WENT_WRONG: AlertMessage = {
  title: 'Something went wrong',
  message: "We weren't able to complete your request. Please try again later.",
};
