import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Storage Engines — Interactive Visualizations",
	description:
		"Explore storage engine primitives: Key-Value Store, Append-Only Log, Write Ahead Log, SSTable, and LSM Tree.",
	keywords: [
		"storage engine",
		"key-value store",
		"append-only log",
		"WAL",
		"SSTable",
		"LSM tree",
		"distributed systems",
	],
	alternates: { canonical: "/storage" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Storage Engines"
				description="Interactive visualizations of storage engine primitives."
				path="/storage"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Storage", href: "/storage" },
				]}
			/>
			{children}
		</>
	);
}
