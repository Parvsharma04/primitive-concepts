import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Consumer Groups — Interactive Visualization",
	description:
		"Learn Consumer Groups: distribute partitions across consumers for parallel processing with load balancing.",
	keywords: [
		"consumer groups",
		"partitions",
		"parallel processing",
		"kafka",
		"distributed systems",
	],
	alternates: { canonical: "/messaging/consumer-groups" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Consumer Groups"
				description="Interactive visualization of consumer group message distribution."
				path="/messaging/consumer-groups"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Messaging", href: "/messaging" },
					{ name: "Consumer Groups", href: "/messaging/consumer-groups" },
				]}
			/>
			{children}
		</>
	);
}
