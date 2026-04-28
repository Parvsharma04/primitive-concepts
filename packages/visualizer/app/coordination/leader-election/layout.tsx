import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Leader Election — Interactive Visualization",
	description:
		"Learn leader election: elect a single leader among distributed nodes to coordinate work with automatic failover.",
	keywords: [
		"leader election",
		"bully algorithm",
		"distributed coordination",
		"failover",
		"distributed systems",
	],
	alternates: { canonical: "/coordination/leader-election" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Leader Election"
				description="Interactive visualization of leader election in distributed systems."
				path="/coordination/leader-election"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Coordination", href: "/coordination" },
					{ name: "Leader Election", href: "/coordination/leader-election" },
				]}
			/>
			{children}
		</>
	);
}
