import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Sliding Window Log Rate Limiter — Interactive Visualization",
    description:
        "Learn how the Sliding Window Log rate limiter works. Store every request timestamp, filter stale entries, and achieve 100% accurate rate limiting. Interactive TypeScript visualization.",
    keywords: [
        "sliding window log",
        "rate limiting algorithm",
        "request timestamps",
        "accurate rate limiter",
        "distributed systems",
        "system design",
    ],
    alternates: { canonical: "/rate-limiting/sliding-window-log" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Sliding Window Log Rate Limiter"
                description="Interactive visualization of the Sliding Window Log rate limiting algorithm."
                path="/rate-limiting/sliding-window-log"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Rate Limiting", href: "/rate-limiting" },
                    { name: "Sliding Window Log", href: "/rate-limiting/sliding-window-log" },
                ]}
            />
            {children}
        </>
    );
}
