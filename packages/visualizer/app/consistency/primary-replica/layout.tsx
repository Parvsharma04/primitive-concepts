import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Primary-Replica Replication — Interactive Visualization",
	description:
		"Learn primary-replica replication: one primary handles writes and replicates to read replicas.",
	keywords: [
		"primary replica",
		"master slave",
		"replication",
		"read scaling",
		"replication lag",
		"distributed systems",
	],
	alternates: { canonical: "/consistency/primary-replica" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Primary-Replica Replication"
				description="Interactive visualization of primary-replica replication with lag."
				path="/consistency/primary-replica"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consistency", href: "/consistency" },
					{ name: "Primary-Replica", href: "/consistency/primary-replica" },
				]}
			/>
			{children}
		</>
	);
}
