import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Distributed Lock — Interactive Visualization",
	description:
		"Learn distributed locks: ensure mutual exclusion across nodes. Only one process holds the lock at a time.",
	keywords: [
		"distributed lock",
		"mutual exclusion",
		"locking",
		"concurrency",
		"distributed systems",
	],
	alternates: { canonical: "/coordination/distributed-lock" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Distributed Lock"
				description="Interactive visualization of distributed lock acquisition and release."
				path="/coordination/distributed-lock"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Coordination", href: "/coordination" },
					{ name: "Distributed Lock", href: "/coordination/distributed-lock" },
				]}
			/>
			{children}
		</>
	);
}
