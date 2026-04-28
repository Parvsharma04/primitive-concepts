import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Pub/Sub Broker — Interactive Visualization",
	description:
		"Learn Pub/Sub messaging: publishers emit to topics, subscribers receive matching messages without tight coupling.",
	keywords: [
		"pub/sub",
		"publish subscribe",
		"message broker",
		"topics",
		"event-driven",
		"distributed systems",
	],
	alternates: { canonical: "/messaging/pub-sub-broker" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Pub/Sub Broker"
				description="Interactive visualization of publish/subscribe messaging pattern."
				path="/messaging/pub-sub-broker"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Messaging", href: "/messaging" },
					{ name: "Pub/Sub Broker", href: "/messaging/pub-sub-broker" },
				]}
			/>
			{children}
		</>
	);
}
