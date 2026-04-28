import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Write Ahead Log (WAL) — Interactive Visualization",
	description:
		"Learn Write Ahead Logs: log mutations before applying them to enable crash recovery.",
	keywords: [
		"write ahead log",
		"WAL",
		"crash recovery",
		"durability",
		"transaction log",
		"distributed systems",
	],
	alternates: { canonical: "/storage/write-ahead-log" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Write Ahead Log (WAL)"
				description="Interactive visualization of Write Ahead Log for crash recovery."
				path="/storage/write-ahead-log"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Storage", href: "/storage" },
					{ name: "Write Ahead Log", href: "/storage/write-ahead-log" },
				]}
			/>
			{children}
		</>
	);
}
