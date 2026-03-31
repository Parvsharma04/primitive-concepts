import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Bulkhead Pattern — Interactive Visualization",
    description:
        "Learn the Bulkhead pattern: isolate concurrent workloads into fixed-capacity compartments with execution slots and a bounded queue. Prevent one overwhelmed resource from starving others.",
    keywords: [
        "bulkhead pattern",
        "bulkhead isolation",
        "concurrency control",
        "resource isolation",
        "thread pool",
        "bounded queue",
        "fault tolerance",
        "distributed systems",
        "system design",
        "microservices",
    ],
    alternates: { canonical: "/resilience/bulkhead" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Bulkhead Pattern"
                description="Interactive visualization of the Bulkhead pattern — isolate workloads to prevent cascading resource exhaustion."
                path="/resilience/bulkhead"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Resilience", href: "/resilience" },
                    { name: "Bulkhead", href: "/resilience/bulkhead" },
                ]}
            />
            {children}
        </>
    );
}
