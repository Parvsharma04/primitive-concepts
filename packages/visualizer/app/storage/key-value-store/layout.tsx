import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Key-Value Store — Interactive Visualization",
	description:
		"Learn key-value stores: simple get/put/delete interface backed by a hash map.",
	keywords: [
		"key-value store",
		"hash map",
		"get put delete",
		"storage",
		"distributed systems",
	],
	alternates: { canonical: "/storage/key-value-store" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Key-Value Store"
				description="Interactive visualization of a key-value store."
				path="/storage/key-value-store"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Storage", href: "/storage" },
					{ name: "Key-Value Store", href: "/storage/key-value-store" },
				]}
			/>
			{children}
		</>
	);
}
