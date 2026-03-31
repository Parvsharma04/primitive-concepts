import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sys.parvsharma.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "sys-d — Interactive Distributed Systems Visualizer",
    template: "%s | sys-d",
  },
  description:
    "Learn distributed systems by building them. Interactive visualizations of rate limiters, circuit breakers, retry strategies, bulkheads, and more — all built from scratch in TypeScript.",
  keywords: [
    "distributed systems",
    "rate limiting",
    "circuit breaker",
    "retry backoff",
    "token bucket",
    "leaky bucket",
    "sliding window",
    "bulkhead pattern",
    "hedged requests",
    "fallback strategy",
    "timeout wrapper",
    "system design",
    "interactive visualization",
    "TypeScript",
    "learn distributed systems",
  ],
  authors: [{ name: "Parv Sharma", url: "https://github.com/Parvsharma04" }],
  creator: "Parv Sharma",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "sys-d",
    title: "sys-d — Interactive Distributed Systems Visualizer",
    description:
      "Learn distributed systems by building them. Interactive visualizations of rate limiters, circuit breakers, bulkheads, and more — built from scratch in TypeScript.",
  },
  twitter: {
    card: "summary_large_image",
    title: "sys-d — Interactive Distributed Systems Visualizer",
    description:
      "Learn distributed systems by building them. Interactive visualizations of rate limiters, circuit breakers, bulkheads, and more.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
