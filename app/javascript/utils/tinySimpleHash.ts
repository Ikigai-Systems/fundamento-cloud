const tinySimpleHash = (s: string): number => {
  let h = 9;
  for (let i = 0; i < s.length;) {
    h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
  }
  return h ^ h >>> 9;
};

export default tinySimpleHash;
