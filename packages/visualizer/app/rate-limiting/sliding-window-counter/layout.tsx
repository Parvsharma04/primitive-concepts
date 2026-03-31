import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Sliding Window Counter Rate Limiter — Interactive Visualization",
    description:
        "Learn the Sliding Window Counter rate limiter — a hybrid approach using weighted counters from current and previous windows. Best balance of accuracy and memory. Interactive visualization.",
    keywords: [
        "sliding window counter",
        "rate limiting algorithm",
        "weighted counter",
        "hybrid rate limiter",
        "distributed systems",
        "system design",
    ],
    alternates: { canonical: "/rate-limiting/sliding-window-counter" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Sliding Window Counter Rate Limiter"
                description="Interactive visualization of the Sliding Window Counter rate limiting algorithm."
                path="/rate-limiting/sliding-window-counter"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Rate Limiting", href: "/rate-limiting" },
                    { name: "Sliding Window Counter", href: "/rate-limiting/sliding-window-counter" },
                ]}
            />
            {children}
        </>
    );
}
