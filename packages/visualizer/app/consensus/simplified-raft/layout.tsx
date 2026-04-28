import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Simplified Raft Consensus — Interactive Visualization",
	description:
		"Learn Raft consensus: leader election, log replication, and commit on majority acknowledgment.",
	keywords: [
		"raft",
		"consensus",
		"leader election",
		"log replication",
		"distributed systems",
	],
	alternates: { canonical: "/consensus/simplified-raft" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Simplified Raft"
				description="Interactive visualization of the Raft consensus algorithm."
				path="/consensus/simplified-raft"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consensus", href: "/consensus" },
					{ name: "Simplified Raft", href: "/consensus/simplified-raft" },
				]}
			/>
			{children}
		</>
	);
}
