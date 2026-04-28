import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "API Key Validation — Interactive Visualization",
	description:
		"Learn API Key validation: authenticate service-to-service requests with pre-shared keys.",
	keywords: [
		"API key",
		"authentication",
		"pre-shared key",
		"stateless auth",
		"distributed systems",
	],
	alternates: { canonical: "/security/api-key-validation" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="API Key Validation"
				description="Interactive visualization of API key-based authentication."
				path="/security/api-key-validation"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Security", href: "/security" },
					{ name: "API Key Validation", href: "/security/api-key-validation" },
				]}
			/>
			{children}
		</>
	);
}
