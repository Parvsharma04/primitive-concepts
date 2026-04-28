import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Dead Letter Queue — Interactive Visualization",
	description:
		"Learn Dead Letter Queues: route failed messages to a separate queue for inspection instead of blocking processing.",
	keywords: [
		"dead letter queue",
		"DLQ",
		"poison message",
		"error handling",
		"distributed systems",
	],
	alternates: { canonical: "/messaging/dead-letter-queue" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Dead Letter Queue"
				description="Interactive visualization of Dead Letter Queue for failed message handling."
				path="/messaging/dead-letter-queue"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Messaging", href: "/messaging" },
					{ name: "Dead Letter Queue", href: "/messaging/dead-letter-queue" },
				]}
			/>
			{children}
		</>
	);
}
