import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Messaging Patterns — Interactive Visualizations",
    description: "Explore messaging patterns: In-Memory Queue, Pub/Sub, delivery guarantees, Dead Letter Queue, Consumer Groups, and Partitioned Log.",
    keywords: ["messaging patterns", "message queue", "pub/sub", "dead letter queue", "consumer groups", "partitioned log", "kafka", "distributed systems"],
    alternates: { canonical: "/messaging" },
};

export default function MessagingLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Messaging Patterns for Distributed Systems"
                description="Interactive visualizations of messaging primitives for asynchronous communication between services."
                path="/messaging"
                breadcrumbs={[{ name: "Home", href: "/" }, { name: "Messaging", href: "/messaging" }]}
            />
            {children}
        </>
    );
}
