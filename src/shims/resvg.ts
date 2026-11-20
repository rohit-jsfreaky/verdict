// Stand-in for @resvg/resvg-js (a native add-on, which neither browsers nor Cloudflare Workers can load): the
// WebAssembly build has the same Resvg class. initWasm() runs first (src/lib/render-route.ts).
export { Resvg } from "@resvg/resvg-wasm";
