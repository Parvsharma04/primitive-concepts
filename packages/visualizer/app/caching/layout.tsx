import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Caching Patterns — Interactive Visualizations",
    description:
        "Explore caching patterns for distributed systems: LRU, LFU, TTL, Cache Aside, Write-Through/Back, Cache Stampede Protection, and Bloom Filters. Interactive TypeScript visualizations.",
    keywords: [
        "caching patterns",
        "LRU cache",
        "LFU cache",
        "TTL cache",
        "cache aside",
        "write-through cache",
        "write-back cache",
        "cache stampede",
        "bloom filter",
        "distributed systems",
        "system design",
    ],
    alternates: { canonical: "/caching" },
};

export default function CachingLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Caching Patterns for Distributed Systems"
                description="Interactive visualizations of caching strategies that improve performance and reduce load on backend stores."
                path="/caching"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Caching", href: "/caching" },
                ]}
            />
            {children}
        </>
    );
}
