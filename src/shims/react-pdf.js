// Browser stand-in for @react-pdf/renderer: its browser build, plus renderToBuffer (Node-only there) made from
// pdf().toBlob(), which Hyper Elements' renderPdf() calls.
import { pdf } from "../../node_modules/@react-pdf/renderer/lib/react-pdf.browser.js";

export * from "../../node_modules/@react-pdf/renderer/lib/react-pdf.browser.js";
export const renderToBuffer = async (element) => new Uint8Array(await (await pdf(element).toBlob()).arrayBuffer());
