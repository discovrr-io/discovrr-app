import {
  getWordCount,
  shortenLargeNumber,
  ShortenedNumberSuffix as S,
} from './functions';

describe('shortening a large number', () => {
  it('formats a small number as it is', () => {
    expect(shortenLargeNumber(-100)).toBe('-100');
    expect(shortenLargeNumber(0)).toBe('0');
    expect(shortenLargeNumber(100)).toBe('100');
    expect(shortenLargeNumber(999)).toBe('999');
  });

  it('shortens a number in the thousands', () => {
    expect(shortenLargeNumber(1_000)).toBe(`1.0${S.THOUSAND}`);
    expect(shortenLargeNumber(1_234)).toBe(`1.2${S.THOUSAND}`);
    expect(shortenLargeNumber(1_555)).toBe(`1.6${S.THOUSAND}`);
    expect(shortenLargeNumber(1_999)).toBe(`2.0${S.THOUSAND}`);

    expect(shortenLargeNumber(10_000)).toBe(`10.0${S.THOUSAND}`);
    expect(shortenLargeNumber(12_345)).toBe(`12.3${S.THOUSAND}`);
    expect(shortenLargeNumber(15_555)).toBe(`15.6${S.THOUSAND}`);
    expect(shortenLargeNumber(19_999)).toBe(`20.0${S.THOUSAND}`);

    expect(shortenLargeNumber(100_000)).toBe(`100.0${S.THOUSAND}`);
    expect(shortenLargeNumber(123_456)).toBe(`123.5${S.THOUSAND}`);
    expect(shortenLargeNumber(155_555)).toBe(`155.6${S.THOUSAND}`);
    expect(shortenLargeNumber(199_999)).toBe(`200.0${S.THOUSAND}`);
  });

  it('shortens a number in the millions', () => {
    expect(shortenLargeNumber(1_000_000)).toBe(`1.0${S.MILLION}`);
    expect(shortenLargeNumber(1_234_567)).toBe(`1.2${S.MILLION}`);
    expect(shortenLargeNumber(1_555_555)).toBe(`1.6${S.MILLION}`);
    expect(shortenLargeNumber(1_999_999)).toBe(`2.0${S.MILLION}`);

    expect(shortenLargeNumber(10_000_000)).toBe(`10.0${S.MILLION}`);
    expect(shortenLargeNumber(12_345_678)).toBe(`12.3${S.MILLION}`);
    expect(shortenLargeNumber(15_555_555)).toBe(`15.6${S.MILLION}`);
    expect(shortenLargeNumber(19_999_999)).toBe(`20.0${S.MILLION}`);

    expect(shortenLargeNumber(100_000_000)).toBe(`100.0${S.MILLION}`);
    expect(shortenLargeNumber(123_456_789)).toBe(`123.5${S.MILLION}`);
    expect(shortenLargeNumber(155_555_555)).toBe(`155.6${S.MILLION}`);
    expect(shortenLargeNumber(199_999_999)).toBe(`200.0${S.MILLION}`);
  });

  it('shortens a number in the billions', () => {
    expect(shortenLargeNumber(1_000_000_000)).toBe(`1.0${S.BILLION}`);
    expect(shortenLargeNumber(1_234_567_890)).toBe(`1.2${S.BILLION}`);
    expect(shortenLargeNumber(1_555_555_555)).toBe(`1.6${S.BILLION}`);
    expect(shortenLargeNumber(1_999_999_999)).toBe(`2.0${S.BILLION}`);

    expect(shortenLargeNumber(10_000_000_000)).toBe(`10.0${S.BILLION}`);
    expect(shortenLargeNumber(12_345_678_987)).toBe(`12.3${S.BILLION}`);
    expect(shortenLargeNumber(15_555_555_555)).toBe(`15.6${S.BILLION}`);
    expect(shortenLargeNumber(19_999_999_999)).toBe(`20.0${S.BILLION}`);

    expect(shortenLargeNumber(100_000_000_000)).toBe(`100.0${S.BILLION}`);
    expect(shortenLargeNumber(123_456_789_876)).toBe(`123.5${S.BILLION}`);
    expect(shortenLargeNumber(155_555_555_555)).toBe(`155.6${S.BILLION}`);
    expect(shortenLargeNumber(199_999_999_999)).toBe(`200.0${S.BILLION}`);
  });
});

describe('calculating word count', () => {
  it('calculates the correct number of words in English', () => {
    expect(getWordCount('')).toBe(0);
    expect(getWordCount('\n')).toBe(0);
    expect(getWordCount('Hello')).toBe(1);
    expect(getWordCount('Hello\n')).toBe(1);
    expect(getWordCount('Hello, world!')).toBe(2);
    expect(getWordCount('Hello, world!\n')).toBe(2);
    expect(getWordCount('Hello, world!\nHow are you guys?')).toBe(6);
    expect(getWordCount('Hello, world!\nHow are you guys?\n')).toBe(6);
    expect(getWordCount('Hello, world!\nHow are you guys?\n')).toBe(6);
    expect(getWordCount('Hello\nworld\nHow\nare\nyou\nguys\n')).toBe(6);
  });
});
