import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Security Patterns — Interactive Visualizations",
	description:
		"Explore security primitives: JWT Validation, API Key Validation, Idempotency Key, and HMAC Verification.",
	keywords: [
		"security",
		"JWT",
		"API key",
		"idempotency",
		"HMAC",
		"authentication",
		"distributed systems",
	],
	alternates: { canonical: "/security" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Security Patterns"
				description="Interactive visualizations of security primitives for distributed systems."
				path="/security"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Security", href: "/security" },
				]}
			/>
			{children}
		</>
	);
}
