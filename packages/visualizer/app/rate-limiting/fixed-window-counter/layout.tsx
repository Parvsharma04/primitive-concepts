import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
    title: "Fixed Window Counter Rate Limiter — Interactive Visualization",
    description:
        "Learn how the Fixed Window Counter rate limiting algorithm works. Divide time into fixed windows, count requests per window, and see the boundary burst problem in action.",
    keywords: [
        "fixed window counter",
        "rate limiting algorithm",
        "API rate limiter",
        "request throttling",
        "distributed systems",
        "system design",
    ],
    alternates: { canonical: "/rate-limiting/fixed-window-counter" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd
                title="Fixed Window Counter Rate Limiter"
                description="Interactive visualization of the Fixed Window Counter rate limiting algorithm."
                path="/rate-limiting/fixed-window-counter"
                breadcrumbs={[
                    { name: "Home", href: "/" },
                    { name: "Rate Limiting", href: "/rate-limiting" },
                    { name: "Fixed Window Counter", href: "/rate-limiting/fixed-window-counter" },
                ]}
            />
            {children}
        </>
    );
}
