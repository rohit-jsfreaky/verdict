// Browser stand-in for node:crypto's createHash, as Hyper Elements' PDF renderer uses it: to name a registered font
// family from its files. Only uniqueness matters there, so four seeded 32-bit FNV-1a passes stand in for sha256.
export function createHash() {
  let text = "";
  const fnv = (seed: number) => {
    let h = seed >>> 0;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
    return h.toString(16).padStart(8, "0");
  };
  const hash = {
    update(s: string) {
      text += s;
      return hash;
    },
    digest: () => [0x811c9dc5, 0x9e3779b9, 0x2545f491, 0x6a09e667].map(fnv).join(""),
  };
  return hash;
}
