/**
 * @module       Reflectr
 * @description  Invert the first/second-person pronouns of an English string
 * @version      0.0.3
 * @exports      invert
 * @author       P. Hughes <github@phugh.es> (https://www.phugh.es)
 * @copyright    2024 P. Hughes. All rights reserved.
 * @license      MIT
 *
 * @example
 * ```javascript
 * import { invert } from 'reflectr';
 * const inverted = invert('I want to go to the moon');
 * console.log(inverted); // 'You want to go to the moon'
 * ```
 */

import { tokenizer } from "happynodetokenizer";
import { PREPOSITIONS, PRONOUNS } from "./data.js";

type Mod = {
  diff: number;
  end: number;
  replacement: string;
  start: number;
};

const memoize = <T extends any[], U>(fn: (...args: T) => U): ((...args: T) => U) => {
  const cache: Map<string, U> = new Map();
  return (...args: T): U => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const val = fn(...args);
    cache.set(key, val);
    return val;
  };
};

const clean: (word: string) => string = memoize((word: string): string => word.toLowerCase().trim());

const matchCase: (text: string, pattern: string) => string = memoize((text: string, pattern: string): string => {
  const char = text.charAt(0);
  const code = pattern.charCodeAt(0);
  if (code >= 65 && code < 91) {
    // 65 is 'A', 90 is 'Z'
    return char.toUpperCase() + text.slice(1);
  } else {
    return char.toLowerCase() + text.slice(1);
  }
});

const isPreposition: (word: string) => boolean = memoize((word: string): boolean => {
  return PREPOSITIONS.includes(clean(word));
});

const replacePronoun: (word: string) => string = memoize((word: string): string => {
  const cleaned = clean(word);
  if (Object.prototype.hasOwnProperty.call(PRONOUNS, cleaned)) {
    return PRONOUNS[cleaned] ?? word;
  }
  return word;
});

const reconstitute: (mods: Mod[], length: number) => string = (mods: Mod[], length: number): string => {
  const resultStr = new Array(length).fill(" ");
  let offset = 0;
  for (const { replacement, start, end, diff } of mods) {
    const startIdx = start + offset;
    const endIdx = end + offset + diff;
    resultStr.splice(startIdx, endIdx - startIdx, ...replacement.split(""));
    offset += diff;
  }
  return resultStr.join("").trim();
};

/**
 * Invert the pronouns of an English language string
 * @param str The string to invert
 * @returns The inverted string
 * @throws {TypeError} If the input is not a string
 *
 * @example
 * ```javascript
 * import { invert } from 'reflectr';
 * const inverted = invert('I want to go to the moon');
 * console.log(inverted); // 'You want to go to the moon'
 * ```
 */
export const invert = (str: string): string => {
  if (typeof str !== "string") {
    throw new TypeError(`Expected a string, received ${typeof str}`);
  }
  if (str === "" || str.trim().length === 0) {
    return str;
  }

  const tokens = [...tokenizer({ preserveCase: true })(str)()];
  const mods: Mod[] = [];

  // cache
  let previousWord: string = "";
  let previousRepl: string = "";

  const resetCache = () => {
    previousWord = "";
    previousRepl = "";
  };

  // modifiers
  let currentlyFirstPerson: number = 0; // 0 = not first person, >0 = first person

  const resetModifiers = () => {
    currentlyFirstPerson = 0;
  };

  // track size differences between original and new strings
  let cumulativeDiff = 0;
  let newStrLength = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const { tag, value, variation, start } = token;

    // bail early if the token is not a word
    if (tag !== "word") {
      // if we move to a new sentence, reset the first person counter
      if (tag === "punct" && /[\"\.\!\?]/.test(value)) {
        resetCache();
        resetModifiers();
      }
      mods.push({ ...token, replacement: value, diff: 0 });
      newStrLength += value.length;
      continue;
    }

    const text = variation || value;
    let currentRepl = text;

    if (!/\b(i|i'll?|you|you'll?|us|are|am)\b/i.test(text)) {
      currentRepl = matchCase(replacePronoun(text), text);
    }

    // handle "I" (becomes 'you')
    else if (/\bi\b/i.test(text)) {
      currentlyFirstPerson++;
      if (start === 0 || previousWord === "") {
        currentRepl = "You";
      } else {
        currentRepl = "you";
      }
      // handle "i'll"
      if (/i\'ll?/i.test(text)) {
        currentRepl += "'ll";
      }
    }

    // handle "you" (can become 'I' or 'me')
    else if (/\byou\b/i.test(text) && !currentlyFirstPerson) {
      if (/you\'ll?/i.test(text)) {
        currentRepl = "I'll";
      } else if (!previousWord || isPreposition(previousWord) || tokens[i + 1]?.tag === "word") {
        currentRepl = "I";
      } else {
        currentRepl = matchCase("me", text);
      }
    }

    // handle 'us' (can remain 'us' or become 'you')
    else if (/\bus\b/i.test(text) && previousWord && isPreposition(previousWord)) {
      currentRepl = "you";
    }

    // handle overzealous 'are' -> 'am' conversion
    else if (/\bare\b/i.test(text) && previousRepl && /\bi\b/i.test(previousRepl)) {
      currentRepl = "am";
    } else if (/\bam\b/i.test(text) && previousRepl && /\byou\b/i.test(previousRepl)) {
      currentRepl = "are";
    }

    // update length offsets
    const diff = currentRepl.length - text.length;
    cumulativeDiff += diff;
    newStrLength += currentRepl.length;

    // update cache
    previousWord = text;
    previousRepl = currentRepl;

    resetModifiers();

    mods.push({
      ...token,
      replacement: currentRepl,
      diff: diff,
    });
  }

  return reconstitute(mods, newStrLength);
};

export default invert;
