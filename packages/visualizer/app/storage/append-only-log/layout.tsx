import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Append-Only Log — Interactive Visualization",
	description:
		"Learn append-only logs: immutable sequential writes for fast writes and natural audit trails.",
	keywords: [
		"append-only log",
		"immutable log",
		"event sourcing",
		"sequential writes",
		"distributed systems",
	],
	alternates: { canonical: "/storage/append-only-log" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Append-Only Log"
				description="Interactive visualization of an append-only log."
				path="/storage/append-only-log"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Storage", href: "/storage" },
					{ name: "Append-Only Log", href: "/storage/append-only-log" },
				]}
			/>
			{children}
		</>
	);
}
