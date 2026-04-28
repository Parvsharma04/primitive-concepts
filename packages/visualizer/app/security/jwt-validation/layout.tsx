import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "JWT Validation — Interactive Visualization",
	description:
		"Learn JWT validation: decode header, payload, and verify signature, expiry, and claims.",
	keywords: [
		"JWT",
		"JSON Web Token",
		"token validation",
		"signature",
		"claims",
		"distributed systems",
	],
	alternates: { canonical: "/security/jwt-validation" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="JWT Validation"
				description="Interactive visualization of JWT decoding and validation."
				path="/security/jwt-validation"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Security", href: "/security" },
					{ name: "JWT Validation", href: "/security/jwt-validation" },
				]}
			/>
			{children}
		</>
	);
}
