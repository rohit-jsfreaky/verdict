// Renders in the browser with the same code the server route used (src/lib/render-route.ts): same request in, same
// response out. The site then needs no server to make PDFs, emails and images (it runs on Cloudflare as static files).
export const renderLocal = async (init: RequestInit) => (await import("./render-route")).POST(new Request(`${location.origin}/api/render`, init));
