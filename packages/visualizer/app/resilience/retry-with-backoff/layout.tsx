import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Retry with Exponential Backoff — Interactive Visualization",
    description:
        "Learn retry with exponential backoff: automatically retry failed operations with progressively increasing delays and optional jitter to avoid thundering herds. Interactive visualization.",
    keywords: [
        "retry with backoff",
        "exponential backoff",
        "retry strategy",
        "jitter",
        "thundering herd",
        "fault tolerance",
        "distributed systems",
        "system design",
        "microservices",
    ],
    alternates: { canonical: "/resilience/retry-with-backoff" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Retry with Exponential Backoff"
                description="Interactive visualization of retry with exponential backoff and jitter for distributed systems."
                path="/resilience/retry-with-backoff"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Resilience", href: "/resilience" },
                    { name: "Retry with Backoff", href: "/resilience/retry-with-backoff" },
                ]}
            />
            {children}
        </>
    );
}
