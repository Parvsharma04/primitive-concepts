import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Idempotency Key — Interactive Visualization",
	description:
		"Learn idempotency keys: deduplicate requests to safely retry without duplicate side effects.",
	keywords: [
		"idempotency",
		"idempotency key",
		"deduplication",
		"safe retry",
		"distributed systems",
	],
	alternates: { canonical: "/security/idempotency-key" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Idempotency Key"
				description="Interactive visualization of idempotency key-based request deduplication."
				path="/security/idempotency-key"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Security", href: "/security" },
					{ name: "Idempotency Key", href: "/security/idempotency-key" },
				]}
			/>
			{children}
		</>
	);
}
