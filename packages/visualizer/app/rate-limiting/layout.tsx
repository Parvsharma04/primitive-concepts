import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Rate Limiting Algorithms — Interactive Visualizations",
    description:
        "Explore and compare rate limiting algorithms: Fixed Window Counter, Sliding Window Log, Sliding Window Counter, Token Bucket, and Leaky Bucket. Interactive visualizations built in TypeScript.",
    keywords: [
        "rate limiting",
        "rate limiter",
        "fixed window counter",
        "sliding window log",
        "sliding window counter",
        "token bucket",
        "leaky bucket",
        "API rate limiting",
        "throttling",
        "distributed systems",
    ],
    alternates: { canonical: "/rate-limiting" },
};

export default function RateLimitingLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Rate Limiting Algorithms"
                description="Interactive visualizations of rate limiting algorithms used in distributed systems."
                path="/rate-limiting"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Rate Limiting", href: "/rate-limiting" },
                ]}
            />
            {children}
        </>
    );
}
