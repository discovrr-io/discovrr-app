export function likedMessage(_strings, person) {
  return {
    headings: { en: `${person} liked your post!` },
    contents: { en: "Looks like you're getting popular 😎" },
  };
}
