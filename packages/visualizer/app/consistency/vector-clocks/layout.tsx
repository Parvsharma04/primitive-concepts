import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Vector Clocks — Interactive Visualization",
	description:
		"Learn Vector Clocks: track causal ordering of events across distributed nodes to detect concurrent updates.",
	keywords: [
		"vector clocks",
		"causal ordering",
		"concurrent events",
		"conflict detection",
		"distributed systems",
	],
	alternates: { canonical: "/consistency/vector-clocks" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Vector Clocks"
				description="Interactive visualization of vector clocks for causal ordering."
				path="/consistency/vector-clocks"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consistency", href: "/consistency" },
					{ name: "Vector Clocks", href: "/consistency/vector-clocks" },
				]}
			/>
			{children}
		</>
	);
}
