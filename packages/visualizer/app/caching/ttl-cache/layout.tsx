import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "TTL Cache — Interactive Visualization",
    description: "Learn TTL (Time-To-Live) cache with automatic expiration. Interactive visualization showing entries expiring after a configurable duration.",
    keywords: ["TTL cache", "time to live", "cache expiration", "cache invalidation", "distributed systems"],
    alternates: { canonical: "/caching/ttl-cache" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="TTL Cache"
                description="Interactive visualization of TTL-based cache expiration."
                path="/caching/ttl-cache"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Caching", href: "/caching" },
                    { name: "TTL Cache", href: "/caching/ttl-cache" },
                ]}
            />
            {children}
        </>
    );
}
