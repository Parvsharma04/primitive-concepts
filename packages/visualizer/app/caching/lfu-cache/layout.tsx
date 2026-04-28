import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "LFU Cache — Interactive Visualization",
    description: "Learn the LFU (Least Frequently Used) cache eviction policy. Interactive visualization showing frequency-based eviction.",
    keywords: ["LFU cache", "least frequently used", "cache eviction", "frequency counter", "distributed systems"],
    alternates: { canonical: "/caching/lfu-cache" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="LFU Cache"
                description="Interactive visualization of the LFU cache eviction policy with frequency tracking."
                path="/caching/lfu-cache"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Caching", href: "/caching" },
                    { name: "LFU Cache", href: "/caching/lfu-cache" },
                ]}
            />
            {children}
        </>
    );
}
