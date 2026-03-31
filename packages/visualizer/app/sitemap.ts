import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sys.parvsharma.in";

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    const staticPages = [
        { url: "", priority: 1.0, changeFrequency: "weekly" as const },
        { url: "/rate-limiting", priority: 0.9, changeFrequency: "weekly" as const },
        { url: "/resilience", priority: 0.9, changeFrequency: "weekly" as const },
    ];

    const rateLimitingPages = [
        "/rate-limiting/fixed-window-counter",
        "/rate-limiting/sliding-window-log",
        "/rate-limiting/sliding-window-counter",
        "/rate-limiting/token-bucket",
        "/rate-limiting/leaky-bucket",
    ];

    const resiliencePages = [
        "/resilience/circuit-breaker",
        "/resilience/retry-with-backoff",
        "/resilience/timeout-wrapper",
        "/resilience/bulkhead",
        "/resilience/hedged-requests",
        "/resilience/fallback-strategy",
    ];

    return [
        ...staticPages.map((page) => ({
            url: `${SITE_URL}${page.url}`,
            lastModified: now,
            changeFrequency: page.changeFrequency,
            priority: page.priority,
        })),
        ...[...rateLimitingPages, ...resiliencePages].map((path) => ({
            url: `${SITE_URL}${path}`,
            lastModified: now,
            changeFrequency: "monthly" as const,
            priority: 0.8,
        })),
    ];
}
