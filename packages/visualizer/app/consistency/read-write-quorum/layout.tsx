import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Read/Write Quorum — Interactive Visualization",
	description:
		"Learn quorum-based consistency: require W writes + R reads where W+R > N for strong consistency.",
	keywords: [
		"quorum",
		"read quorum",
		"write quorum",
		"consistency",
		"CAP theorem",
		"distributed systems",
	],
	alternates: { canonical: "/consistency/read-write-quorum" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Read/Write Quorum"
				description="Interactive visualization of quorum-based consistency."
				path="/consistency/read-write-quorum"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Consistency", href: "/consistency" },
					{ name: "Read/Write Quorum", href: "/consistency/read-write-quorum" },
				]}
			/>
			{children}
		</>
	);
}
