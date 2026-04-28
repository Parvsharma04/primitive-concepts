import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "At-Least-Once Delivery — Interactive Visualization",
	description:
		"Learn at-least-once message delivery: retry until acknowledged. Messages never lost but may duplicate.",
	keywords: [
		"at-least-once",
		"message delivery",
		"retry",
		"acknowledgment",
		"distributed systems",
	],
	alternates: { canonical: "/messaging/at-least-once" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="At-Least-Once Delivery"
				description="Interactive visualization of at-least-once message delivery with retries."
				path="/messaging/at-least-once"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Messaging", href: "/messaging" },
					{ name: "At-Least-Once", href: "/messaging/at-least-once" },
				]}
			/>
			{children}
		</>
	);
}
