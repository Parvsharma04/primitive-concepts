const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sys.parvsharma.in";

interface JsonLdProps {
    title: string;
    description: string;
    path: string;
    breadcrumbs: { name: string; href: string }[];
}

export default function JsonLd({ title, description, path, breadcrumbs }: JsonLdProps) {
    const articleLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: title,
        description,
        url: `${SITE_URL}${path}`,
        author: {
            "@type": "Person",
            name: "Parv Sharma",
            url: "https://github.com/Parvsharma04",
        },
        publisher: {
            "@type": "Organization",
            name: "sys-d",
            url: SITE_URL,
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}${path}`,
        },
        about: {
            "@type": "Thing",
            name: "Distributed Systems",
        },
        inLanguage: "en",
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((bc, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: bc.name,
            item: `${SITE_URL}${bc.href}`,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
        </>
    );
}
