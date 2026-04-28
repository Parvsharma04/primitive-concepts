import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Metrics Collector — Interactive Visualization",
	description:
		"Learn metrics collection: counters, gauges, and rates for monitoring distributed services.",
	keywords: [
		"metrics",
		"counter",
		"gauge",
		"rate",
		"monitoring",
		"distributed systems",
	],
	alternates: { canonical: "/observability/metrics-collector" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Metrics Collector"
				description="Interactive visualization of metrics collection with counters and gauges."
				path="/observability/metrics-collector"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Observability", href: "/observability" },
					{
						name: "Metrics Collector",
						href: "/observability/metrics-collector",
					},
				]}
			/>
			{children}
		</>
	);
}
