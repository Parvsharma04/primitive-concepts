import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Leaky Bucket Rate Limiter — Interactive Visualization",
    description:
        "Learn how the Leaky Bucket rate limiter works. Requests fill a bucket that drains at a constant rate, smoothing bursty traffic into a steady flow. Interactive TypeScript visualization.",
    keywords: [
        "leaky bucket",
        "rate limiting algorithm",
        "traffic shaping",
        "constant drain rate",
        "API throttling",
        "distributed systems",
        "system design",
    ],
    alternates: { canonical: "/rate-limiting/leaky-bucket" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Leaky Bucket Rate Limiter"
                description="Interactive visualization of the Leaky Bucket rate limiting algorithm."
                path="/rate-limiting/leaky-bucket"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Rate Limiting", href: "/rate-limiting" },
                    { name: "Leaky Bucket", href: "/rate-limiting/leaky-bucket" },
                ]}
            />
            {children}
        </>
    );
}
