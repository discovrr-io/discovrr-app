import { CustomMatcher } from 'react-native-autolink';

export const USERNAME_REGEX_BASE = /[A-Za-z0-9_.][A-Za-z0-9_.]*/;
export const USERNAME_REGEX = new RegExp(`^${USERNAME_REGEX_BASE.source}$`);

export const USERNAME_MENTION_MATCHER: Pick<CustomMatcher, 'type' | 'pattern'> =
  {
    type: 'custom-mention',
    pattern: new RegExp(
      `@${USERNAME_REGEX_BASE.source}`,
      USERNAME_REGEX_BASE.flags + 'g',
    ),
  };
