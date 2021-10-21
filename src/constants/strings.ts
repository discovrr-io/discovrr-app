export type AlertMessage = { title: string; message: string };

export const FEATURE_UNAVAILABLE: AlertMessage = {
  title: 'Feature Not Available Yet',
  message: "We'll let you know when this feature is ready for you.",
};

export const SOMETHING_WENT_WRONG: AlertMessage = {
  title: 'Something Went Wrong',
  message: "We weren't able to complete your request. Please try again later.",
};
