import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Circuit Breaker Pattern — Interactive Visualization",
    description:
        "Learn the Circuit Breaker pattern: prevent cascading failures by switching between CLOSED, OPEN, and HALF_OPEN states based on failure thresholds. Interactive state machine visualization.",
    keywords: [
        "circuit breaker",
        "circuit breaker pattern",
        "cascading failures",
        "fault tolerance",
        "state machine",
        "half open",
        "distributed systems",
        "system design",
        "microservices",
    ],
    alternates: { canonical: "/resilience/circuit-breaker" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Circuit Breaker Pattern"
                description="Interactive visualization of the Circuit Breaker resilience pattern with CLOSED, OPEN, and HALF_OPEN states."
                path="/resilience/circuit-breaker"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Resilience", href: "/resilience" },
                    { name: "Circuit Breaker", href: "/resilience/circuit-breaker" },
                ]}
            />
            {children}
        </>
    );
}
