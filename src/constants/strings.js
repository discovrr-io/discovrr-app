/**
 * @typedef {{ title: string, message: string }} Message
 */

/** @type {Message} */
export const FEATURE_UNAVAILABLE = {
  title: "We're still working on this!",
  message: "We'll let your know when this feature is ready for you.",
};

/** @type {Message} */
export const SOMETHING_WENT_WRONG = {
  title: 'Something went wrong',
  message: "We weren't able to complete your request. Please try again later.",
};
