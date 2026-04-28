import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Write-Through / Write-Back Cache — Interactive Visualization",
    description: "Compare Write-Through and Write-Back caching strategies. Write-through ensures consistency, write-back improves write performance.",
    keywords: ["write-through cache", "write-back cache", "write-behind", "cache consistency", "distributed systems"],
    alternates: { canonical: "/caching/write-through-back" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Write-Through / Write-Back Cache"
                description="Interactive comparison of write-through and write-back caching strategies."
                path="/caching/write-through-back"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Caching", href: "/caching" },
                    { name: "Write-Through/Back", href: "/caching/write-through-back" },
                ]}
            />
            {children}
        </>
    );
}
