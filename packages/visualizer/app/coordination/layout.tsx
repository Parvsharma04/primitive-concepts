import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Coordination Patterns — Interactive Visualizations",
	description:
		"Explore coordination patterns: Distributed Lock, Leader Election, Heartbeat Monitoring, Service Registry, and Service Discovery.",
	keywords: [
		"coordination",
		"distributed lock",
		"leader election",
		"heartbeat",
		"service registry",
		"service discovery",
		"distributed systems",
	],
	alternates: { canonical: "/coordination" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Coordination Patterns"
				description="Interactive visualizations of coordination primitives for distributed systems."
				path="/coordination"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Coordination", href: "/coordination" },
				]}
			/>
			{children}
		</>
	);
}
