import { Anton, Inter } from "next/font/google";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const metadata = {
  title: "Multiverse — an MCU fan experience",
  description: "Fly through the MCU films and meet the heroes in 3D. Built with Next.js, Three.js and GSAP.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
