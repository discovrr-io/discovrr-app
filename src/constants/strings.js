/**
 * @typedef {{ title: string, message: string }} Message
 */

/** @type {Message} */
export const FEATURE_UNAVAILABLE = {
  title: 'Feature Not Available',
  message: "Sorry, we're still working on this feature at the moment.",
};

/** @type {Message} */
export const SOMETHING_WENT_WRONG = {
  title: 'Something Went Wrong',
  message: "We weren't able to complete your request. Please try again later.",
};
