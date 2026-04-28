import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Cache Aside Pattern — Interactive Visualization",
    description: "Learn the Cache Aside (Lazy Loading) pattern. Application checks cache first, fetches from DB on miss, then populates cache.",
    keywords: ["cache aside", "lazy loading", "cache miss", "cache hit", "read-through", "distributed systems"],
    alternates: { canonical: "/caching/cache-aside" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Cache Aside Pattern"
                description="Interactive visualization of the Cache Aside caching strategy."
                path="/caching/cache-aside"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Caching", href: "/caching" },
                    { name: "Cache Aside", href: "/caching/cache-aside" },
                ]}
            />
            {children}
        </>
    );
}
