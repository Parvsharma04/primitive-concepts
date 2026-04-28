import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Heartbeat Monitor — Interactive Visualization",
	description:
		"Learn heartbeat monitoring: detect node failures through periodic health signals.",
	keywords: [
		"heartbeat",
		"health check",
		"failure detection",
		"monitoring",
		"distributed systems",
	],
	alternates: { canonical: "/coordination/heartbeat-monitor" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Heartbeat Monitor"
				description="Interactive visualization of heartbeat-based failure detection."
				path="/coordination/heartbeat-monitor"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Coordination", href: "/coordination" },
					{
						name: "Heartbeat Monitor",
						href: "/coordination/heartbeat-monitor",
					},
				]}
			/>
			{children}
		</>
	);
}
