import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Histogram — Interactive Visualization",
	description:
		"Learn histograms: track value distributions with buckets and compute percentiles (p50, p95, p99).",
	keywords: [
		"histogram",
		"percentiles",
		"p99",
		"latency distribution",
		"buckets",
		"distributed systems",
	],
	alternates: { canonical: "/observability/histogram" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Histogram"
				description="Interactive visualization of histogram-based percentile computation."
				path="/observability/histogram"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Observability", href: "/observability" },
					{ name: "Histogram", href: "/observability/histogram" },
				]}
			/>
			{children}
		</>
	);
}
