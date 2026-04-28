import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Consensus Algorithms — Interactive Visualizations",
	description:
		"Explore consensus algorithms: Two Phase Commit, Three Phase Commit, and Simplified Raft for distributed agreement.",
	keywords: [
		"consensus",
		"two phase commit",
		"three phase commit",
		"raft",
		"distributed agreement",
		"distributed systems",
	],
	alternates: { canonical: "/consensus" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Consensus Algorithms"
				description="Interactive visualizations of consensus algorithms for distributed agreement."
				path="/consensus"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consensus", href: "/consensus" },
				]}
			/>
			{children}
		</>
	);
}
