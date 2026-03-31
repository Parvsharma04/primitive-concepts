import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Fallback Strategy Pattern — Interactive Visualization",
    description:
        "Learn the Fallback Strategy pattern: chain alternative providers to gracefully degrade through progressively simpler responses — primary service, secondary, cache, then static defaults.",
    keywords: [
        "fallback strategy",
        "fallback pattern",
        "graceful degradation",
        "fault tolerance",
        "service fallback",
        "cache fallback",
        "default response",
        "distributed systems",
        "system design",
        "microservices",
    ],
    alternates: { canonical: "/resilience/fallback-strategy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Fallback Strategy Pattern"
                description="Interactive visualization of the Fallback Strategy pattern — chain alternative providers for graceful degradation."
                path="/resilience/fallback-strategy"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Resilience", href: "/resilience" },
                    { name: "Fallback Strategy", href: "/resilience/fallback-strategy" },
                ]}
            />
            {children}
        </>
    );
}
