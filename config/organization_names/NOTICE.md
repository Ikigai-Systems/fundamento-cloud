# Organization name word lists

`adjectives.txt` and `nouns.txt` are used by `OrganizationNameGenerator`
(`app/services/organization_name_generator.rb`) to build friendly, random
organization names (e.g. "Bright Meadow") for users who sign up without an
organization.

## Source & license

The word lists are vendored from
[glitchdotcom/friendly-words](https://github.com/glitchdotcom/friendly-words):

- `adjectives.txt` ← `words/predicates.txt`
- `nouns.txt` ← `words/objects.txt`

friendly-words is distributed under the **MIT License**:

```
MIT License

Copyright (c) 2017 Fog Creek Software, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The lists are curated to be friendly, positive, and safe for a general
audience. Each file contains one lowercase word per line (`/\A[a-z]+\z/`).
