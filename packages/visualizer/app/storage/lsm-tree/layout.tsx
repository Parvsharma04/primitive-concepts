import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "LSM Tree — Interactive Visualization",
	description:
		"Learn LSM Trees: buffer writes in a memtable, flush to sorted SSTables, compact in background.",
	keywords: [
		"LSM tree",
		"log-structured merge",
		"memtable",
		"compaction",
		"storage engine",
		"distributed systems",
	],
	alternates: { canonical: "/storage/lsm-tree" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="LSM Tree"
				description="Interactive visualization of the Log-Structured Merge Tree."
				path="/storage/lsm-tree"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Storage", href: "/storage" },
					{ name: "LSM Tree", href: "/storage/lsm-tree" },
				]}
			/>
			{children}
		</>
	);
}
