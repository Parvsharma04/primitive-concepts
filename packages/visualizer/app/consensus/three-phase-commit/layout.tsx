import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Three Phase Commit — Interactive Visualization",
	description:
		"Learn 3PC: adds a pre-commit phase to reduce blocking when the coordinator fails.",
	keywords: [
		"three phase commit",
		"3PC",
		"non-blocking",
		"distributed transaction",
		"distributed systems",
	],
	alternates: { canonical: "/consensus/three-phase-commit" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Three Phase Commit (3PC)"
				description="Interactive visualization of the Three Phase Commit protocol."
				path="/consensus/three-phase-commit"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consensus", href: "/consensus" },
					{ name: "Three Phase Commit", href: "/consensus/three-phase-commit" },
				]}
			/>
			{children}
		</>
	);
}
