import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "SSTable — Interactive Visualization",
	description:
		"Learn SSTables: sorted, immutable key-value files with sparse indexes for fast lookups.",
	keywords: [
		"SSTable",
		"sorted string table",
		"immutable",
		"sparse index",
		"storage engine",
		"distributed systems",
	],
	alternates: { canonical: "/storage/sstable" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="SSTable (Sorted String Table)"
				description="Interactive visualization of SSTables with sorted, immutable data."
				path="/storage/sstable"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Storage", href: "/storage" },
					{ name: "SSTable", href: "/storage/sstable" },
				]}
			/>
			{children}
		</>
	);
}
