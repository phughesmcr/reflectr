import { tokenizer } from "happynodetokenizer";
import { PREPOSITIONS, PRONOUNS } from "./data.js";
const memoize = (fn) => {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key))
            return cache.get(key);
        const val = fn(...args);
        cache.set(key, val);
        return val;
    };
};
const clean = memoize((word) => word.toLowerCase().trim());
const matchCase = memoize((text, pattern) => {
    if (text === pattern)
        return text;
    const char = text.charAt(0);
    const code = pattern.charCodeAt(0);
    if (code >= 65 && code < 91) {
        return char.toUpperCase() + text.slice(1);
    }
    else {
        return char.toLowerCase() + text.slice(1);
    }
});
const isPreposition = memoize((word) => {
    return PREPOSITIONS.includes(clean(word));
});
const replacePronoun = memoize((word) => {
    const cleaned = clean(word);
    if (Object.prototype.hasOwnProperty.call(PRONOUNS, cleaned)) {
        return PRONOUNS[cleaned] ?? word;
    }
    return word;
});
const reconstitute = (mods, length) => {
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
export const invert = (str) => {
    if (typeof str !== "string") {
        throw new TypeError(`Expected a string, received ${typeof str}`);
    }
    if (str === "" || str.trim().length === 0) {
        return str;
    }
    const tokens = [...tokenizer({ preserveCase: true })(str)()];
    const mods = [];
    let previousWord = "";
    let previousRepl = "";
    const resetCache = () => {
        previousWord = "";
        previousRepl = "";
    };
    let currentlyFirstPerson = 0;
    const resetModifiers = () => {
        currentlyFirstPerson = 0;
    };
    let cumulativeDiff = 0;
    let newStrLength = 0;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const { tag, value, variation, start } = token;
        if (tag !== "word") {
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
        else if (/\bi\b/i.test(text)) {
            currentlyFirstPerson++;
            if (start === 0 || previousWord === "") {
                currentRepl = "You";
            }
            else {
                currentRepl = "you";
            }
            if (/i\'ll?/i.test(text)) {
                currentRepl += "'ll";
            }
        }
        else if (/\byou\b/i.test(text) && !currentlyFirstPerson) {
            if (/you\'ll?/i.test(text)) {
                currentRepl = "I'll";
            }
            else if (!previousWord || isPreposition(previousWord) || tokens[i + 1]?.tag === "word") {
                currentRepl = "I";
            }
            else {
                currentRepl = matchCase("me", text);
            }
        }
        else if (/\bus\b/i.test(text) && previousWord && isPreposition(previousWord)) {
            currentRepl = "you";
        }
        else if (/\bare\b/i.test(text) && previousRepl && /\bi\b/i.test(previousRepl)) {
            currentRepl = "am";
        }
        else if (/\bam\b/i.test(text) && previousRepl && /\byou\b/i.test(previousRepl)) {
            currentRepl = "are";
        }
        const diff = currentRepl.length - text.length;
        cumulativeDiff += diff;
        newStrLength += currentRepl.length;
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
//# sourceMappingURL=index.js.map