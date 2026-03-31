import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Resilience Patterns — Interactive Visualizations",
    description:
        "Explore resilience patterns for distributed systems: Circuit Breaker, Retry with Backoff, Timeout Wrapper, Bulkhead, Hedged Requests, and Fallback Strategy. Interactive TypeScript visualizations.",
    keywords: [
        "resilience patterns",
        "circuit breaker",
        "retry backoff",
        "timeout wrapper",
        "bulkhead pattern",
        "hedged requests",
        "fallback strategy",
        "fault tolerance",
        "distributed systems",
        "system design",
    ],
    alternates: { canonical: "/resilience" },
};

export default function ResilienceLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Resilience Patterns for Distributed Systems"
                description="Interactive visualizations of resilience patterns that help distributed services degrade gracefully under failure."
                path="/resilience"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Resilience", href: "/resilience" },
                ]}
            />
            {children}
        </>
    );
}
