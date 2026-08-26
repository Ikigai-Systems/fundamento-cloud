// @hotwired/turbo-rails ships no type declarations at all, and its resolved
// entry file is plain JS TypeScript can see but not type — so it can't be
// given a shadow declaration via `declare module` (that's only valid for
// specifiers TS can't resolve to a real file). Import as `any` instead; call
// sites annotate the values they pull out of it.
declare module "@hotwired/turbo-rails";
