import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "In-Memory Queue — Interactive Visualization",
	description:
		"Learn in-memory FIFO queues for decoupling producers and consumers in distributed systems.",
	keywords: [
		"message queue",
		"FIFO",
		"producer consumer",
		"async",
		"distributed systems",
	],
	alternates: { canonical: "/messaging/in-memory-queue" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="In-Memory Queue"
				description="Interactive visualization of an in-memory FIFO message queue."
				path="/messaging/in-memory-queue"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Messaging", href: "/messaging" },
					{ name: "In-Memory Queue", href: "/messaging/in-memory-queue" },
				]}
			/>
			{children}
		</>
	);
}
