import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Consistency Patterns — Interactive Visualizations",
	description:
		"Explore consistency patterns: Primary-Replica Replication, Read/Write Quorum, Vector Clocks, and CRDT Counters.",
	keywords: [
		"consistency",
		"replication",
		"quorum",
		"vector clocks",
		"CRDT",
		"distributed systems",
	],
	alternates: { canonical: "/consistency" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Consistency Patterns"
				description="Interactive visualizations of consistency models in distributed systems."
				path="/consistency"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consistency", href: "/consistency" },
				]}
			/>
			{children}
		</>
	);
}
