export function someoneLikedPost({ person = 'Someone' }) {
  return {
    headings: { en: `${person} liked your post!` },
    contents: { en: "Looks like you're getting popular 😎" },
  };
}

export function someoneCommentedPost({ person = 'Someone' }) {
  return {
    headings: { en: `${person} commented on your post!` },
    contents: { en: 'Check out what they said 👀' },
  };
}

export function someoneFollowed({ person = 'Someone' }) {
  return {
    headings: { en: `${person} followed you!` },
    contents: { en: 'Why not follow them back 😃' },
  };
}

export function someoneInviteNote({ person = 'Someone' }) {
  return {
    headings: { en: `${person} invited you to their note!` },
    contents: { en: "Check out all the cool stuff they've saved 😃" },
  };
}

export function someoneSharedPost({ person = 'Someone' }) {
  return {
    headings: { en: `${person} shared your post!` },
    contents: { en: 'Check out what they liked!' },
  };
}
