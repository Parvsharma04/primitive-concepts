import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Bloom Filter — Interactive Visualization",
    description: "Learn Bloom Filters: space-efficient probabilistic data structures for set membership testing. May have false positives, never false negatives.",
    keywords: ["bloom filter", "probabilistic data structure", "set membership", "false positive", "hash function", "distributed systems"],
    alternates: { canonical: "/caching/bloom-filter" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Bloom Filter"
                description="Interactive visualization of Bloom Filter probabilistic set membership testing."
                path="/caching/bloom-filter"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Caching", href: "/caching" },
                    { name: "Bloom Filter", href: "/caching/bloom-filter" },
                ]}
            />
            {children}
        </>
    );
}
