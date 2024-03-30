// deno-fmt-ignore-file
import { invert } from "./dist/index.js";

const pairs = [
  ["I want to go to the moon", "You want to go to the moon"],
  ["I am going to our house", "You are going to our house"],
  ["We should take her to the park", "We should take her to the park"],
  ["When I was young, I was a fool", "When you were young, you were a fool"],
  ["This is mine, and that is yours", "That is yours, and this is mine"],
  ["Take yourself to the park", "Take myself to the park"],
  ["Around the ragged rocks your ragged rascal ran", "Around the ragged rocks my ragged rascal ran"],
  ["What's mine is yours and what's yours is mine", "What's yours is mine and what's mine is yours"],
  ["Mine, Mine, mine! I want it all!", "Yours, Yours, yours! You want it all!"],
  [
    "I'll have what she's having, and I am alongside and atop the world",
    "You'll have what she's having, and you are alongside and atop the world",
  ],
];

for (const [input, output] of pairs) {
  const inverted = invert(input);
  const reverted = invert(inverted);
  console.log(inverted === output ? "PASS" : "FAIL", "->", input, "->", inverted);
  console.log(reverted === input ? "PASS" : "FAIL", "->", inverted, "->", reverted);
}
