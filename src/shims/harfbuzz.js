// Stand-in for harfbuzzjs (satori's text shaper): the same promise of an hbjs instance, with its WebAssembly fetched
// from /hb.wasm (a copy in public/) instead of next to a script the bundler moved.
import hb from "../../node_modules/harfbuzzjs/hb.js";
import hbjs from "../../node_modules/harfbuzzjs/hbjs.js";

export default hb({ locateFile: () => "/hb.wasm" }).then((instance) => hbjs(instance));
