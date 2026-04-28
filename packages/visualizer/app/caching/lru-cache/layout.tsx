import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "LRU Cache — Interactive Visualization",
    description: "Learn the LRU (Least Recently Used) cache eviction policy. Interactive visualization of O(1) get/put operations using a hash map and doubly linked list.",
    keywords: ["LRU cache", "least recently used", "cache eviction", "doubly linked list", "hash map", "distributed systems"],
    alternates: { canonical: "/caching/lru-cache" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="LRU Cache"
                description="Interactive visualization of the LRU cache eviction policy with O(1) operations."
                path="/caching/lru-cache"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Caching", href: "/caching" },
                    { name: "LRU Cache", href: "/caching/lru-cache" },
                ]}
            />
            {children}
        </>
    );
}
