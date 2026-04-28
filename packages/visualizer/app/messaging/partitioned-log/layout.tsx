import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Partitioned Log — Interactive Visualization",
	description:
		"Learn Kafka-style partitioned logs: append-only logs split into partitions for ordered, parallel processing.",
	keywords: [
		"partitioned log",
		"kafka",
		"append-only",
		"log-structured",
		"distributed systems",
	],
	alternates: { canonical: "/messaging/partitioned-log" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Partitioned Log"
				description="Interactive visualization of Kafka-style partitioned append-only logs."
				path="/messaging/partitioned-log"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Messaging", href: "/messaging" },
					{ name: "Partitioned Log", href: "/messaging/partitioned-log" },
				]}
			/>
			{children}
		</>
	);
}
