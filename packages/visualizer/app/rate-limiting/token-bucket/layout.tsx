import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Token Bucket Rate Limiter — Interactive Visualization",
    description:
        "Learn how the Token Bucket rate limiter works. Tokens refill at a fixed rate, each request consumes one, and controlled bursting up to bucket capacity is allowed. Interactive visualization.",
    keywords: [
        "token bucket",
        "rate limiting algorithm",
        "burst control",
        "token refill",
        "API throttling",
        "distributed systems",
        "system design",
    ],
    alternates: { canonical: "/rate-limiting/token-bucket" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Token Bucket Rate Limiter"
                description="Interactive visualization of the Token Bucket rate limiting algorithm."
                path="/rate-limiting/token-bucket"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Rate Limiting", href: "/rate-limiting" },
                    { name: "Token Bucket", href: "/rate-limiting/token-bucket" },
                ]}
            />
            {children}
        </>
    );
}
