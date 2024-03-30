# Reflectr

A small, simple, speedy NLP library to invert the first/second-person pronouns in English language strings.

- Preserves case, spacing, punctuation.
- Typescript types.
- Modern, strict, ES2022 code.
- Only 1 dependency (also by me).

Reflectr is intended to cope in most regular English language cases.
This is a naive library which makes limited, sensible decisions.
More complex cases may require advanced NLP techniques.

## Usage

```bash
npm install @phughes/reflectr
```

```javascript
import { invert } from "@phughes/reflectr"; // or "jsr:@phughesmcr/reflectr" if using Deno
invert("I want to go to the moon"); // "You want to go to the moon"
```

For long strings, I recommend splitting by sentence first and then inverting each.

## License

MIT
