import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "CRDT Counters — Interactive Visualization",
	description:
		"Learn CRDT (Conflict-free Replicated Data Types) counters that converge without coordination across replicas.",
	keywords: [
		"CRDT",
		"conflict-free",
		"replicated data types",
		"G-counter",
		"PN-counter",
		"distributed systems",
	],
	alternates: { canonical: "/consistency/crdt-counters" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="CRDT Counters"
				description="Interactive visualization of CRDT counters converging without coordination."
				path="/consistency/crdt-counters"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consistency", href: "/consistency" },
					{ name: "CRDT Counters", href: "/consistency/crdt-counters" },
				]}
			/>
			{children}
		</>
	);
}
