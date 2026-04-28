import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "HMAC Verification — Interactive Visualization",
	description:
		"Learn HMAC: verify message integrity and authenticity using a shared secret to detect tampering.",
	keywords: [
		"HMAC",
		"message authentication",
		"integrity",
		"signature",
		"webhook",
		"distributed systems",
	],
	alternates: { canonical: "/security/hmac-verification" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="HMAC Verification"
				description="Interactive visualization of HMAC-based message integrity verification."
				path="/security/hmac-verification"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Security", href: "/security" },
					{ name: "HMAC Verification", href: "/security/hmac-verification" },
				]}
			/>
			{children}
		</>
	);
}
