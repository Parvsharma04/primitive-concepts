import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Load Balancing Algorithms — Interactive Visualizations",
    description: "Explore load balancing algorithms: Round Robin, Weighted Round Robin, Least Connections, IP Hashing, and Consistent Hashing. Interactive TypeScript visualizations.",
    keywords: ["load balancing", "round robin", "weighted round robin", "least connections", "IP hashing", "consistent hashing", "distributed systems", "system design"],
    alternates: { canonical: "/load-balancing" },
};

export default function LoadBalancingLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Load Balancing Algorithms"
                description="Interactive visualizations of load balancing algorithms for distributing traffic across servers."
                path="/load-balancing"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Load Balancing", href: "/load-balancing" },
                ]}
            />
            {children}
        </>
    );
}
