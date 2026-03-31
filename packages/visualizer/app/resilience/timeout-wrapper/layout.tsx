import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Timeout Wrapper Pattern — Interactive Visualization",
    description:
        "Learn the Timeout Wrapper pattern: race an async operation against a deadline using Promise.race. Fail fast instead of waiting forever. Interactive visualization with configurable parameters.",
    keywords: [
        "timeout wrapper",
        "timeout pattern",
        "Promise.race",
        "fail fast",
        "deadline",
        "async timeout",
        "distributed systems",
        "system design",
        "microservices",
    ],
    alternates: { canonical: "/resilience/timeout-wrapper" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Timeout Wrapper Pattern"
                description="Interactive visualization of the Timeout Wrapper pattern — race operations against deadlines."
                path="/resilience/timeout-wrapper"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Resilience", href: "/resilience" },
                    { name: "Timeout Wrapper", href: "/resilience/timeout-wrapper" },
                ]}
            />
            {children}
        </>
    );
}
