import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Hedged Requests Pattern — Interactive Visualization",
    description:
        "Learn the Hedged Requests pattern: fire duplicate requests after a delay and use whichever responds first to tame tail latency. Based on Google's 'The Tail at Scale' paper. Interactive visualization.",
    keywords: [
        "hedged requests",
        "tail latency",
        "the tail at scale",
        "request racing",
        "duplicate requests",
        "p99 latency",
        "distributed systems",
        "system design",
        "microservices",
        "gRPC hedging",
    ],
    alternates: { canonical: "/resilience/hedged-requests" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Hedged Requests Pattern"
                description="Interactive visualization of the Hedged Requests pattern — race duplicate requests to tame tail latency."
                path="/resilience/hedged-requests"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Resilience", href: "/resilience" },
                    { name: "Hedged Requests", href: "/resilience/hedged-requests" },
                ]}
            />
            {children}
        </>
    );
}
