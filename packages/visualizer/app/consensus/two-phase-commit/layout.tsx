import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Two Phase Commit — Interactive Visualization",
	description:
		"Learn 2PC: coordinator asks participants to prepare then commit for atomic distributed transactions.",
	keywords: [
		"two phase commit",
		"2PC",
		"distributed transaction",
		"atomic commit",
		"coordinator",
		"distributed systems",
	],
	alternates: { canonical: "/consensus/two-phase-commit" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Two Phase Commit (2PC)"
				description="Interactive visualization of the Two Phase Commit protocol."
				path="/consensus/two-phase-commit"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consensus", href: "/consensus" },
					{ name: "Two Phase Commit", href: "/consensus/two-phase-commit" },
				]}
			/>
			{children}
		</>
	);
}
