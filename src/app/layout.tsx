import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../../fonts/SchibstedGrotesk-400.woff", weight: "400" },
    { path: "../../fonts/SchibstedGrotesk-500.woff", weight: "500" },
    { path: "../../fonts/SchibstedGrotesk-600.woff", weight: "600" },
    { path: "../../fonts/SchibstedGrotesk-700.woff", weight: "700" },
    { path: "../../fonts/SchibstedGrotesk-800.woff", weight: "800" },
  ],
  variable: "--font-schibsted",
});
const mono = localFont({
  src: [
    { path: "../../fonts/JetBrainsMono-400.woff", weight: "400" },
    { path: "../../fonts/JetBrainsMono-600.woff", weight: "600" },
  ],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Verdict · Are we affected? Answered and published",
  description:
    "Paste an advisory id. Verdict checks every product's lockfile against it and writes the security statement page, the reply to customers, the signed letter and an OpenVEX file. Built with Hyper Elements.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
