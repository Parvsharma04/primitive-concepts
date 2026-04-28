import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "At-Most-Once Delivery — Interactive Visualization",
	description:
		"Learn at-most-once message delivery: fire and forget. Messages may be lost but never duplicated.",
	keywords: [
		"at-most-once",
		"message delivery",
		"fire and forget",
		"distributed systems",
	],
	alternates: { canonical: "/messaging/at-most-once" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="At-Most-Once Delivery"
				description="Interactive visualization of at-most-once message delivery semantics."
				path="/messaging/at-most-once"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Messaging", href: "/messaging" },
					{ name: "At-Most-Once", href: "/messaging/at-most-once" },
				]}
			/>
			{children}
		</>
	);
}
