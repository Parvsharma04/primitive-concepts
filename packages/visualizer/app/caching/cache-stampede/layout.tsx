import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Cache Stampede Protection — Interactive Visualization",
    description: "Learn cache stampede (thundering herd) protection using locking and probabilistic early expiration.",
    keywords: ["cache stampede", "thundering herd", "cache locking", "probabilistic expiration", "distributed systems"],
    alternates: { canonical: "/caching/cache-stampede" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Cache Stampede Protection"
                description="Interactive visualization of cache stampede prevention techniques."
                path="/caching/cache-stampede"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Caching", href: "/caching" },
                    { name: "Cache Stampede", href: "/caching/cache-stampede" },
                ]}
            />
            {children}
        </>
    );
}
