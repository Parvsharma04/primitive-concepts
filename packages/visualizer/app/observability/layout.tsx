import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Observability Tools — Interactive Visualizations",
	description:
		"Explore observability primitives: Metrics Collector, Histogram, Structured Logger, and Trace ID Propagation.",
	keywords: [
		"observability",
		"metrics",
		"histogram",
		"structured logging",
		"distributed tracing",
		"trace ID",
		"distributed systems",
	],
	alternates: { canonical: "/observability" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Observability Tools"
				description="Interactive visualizations of observability primitives for monitoring distributed systems."
				path="/observability"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Observability", href: "/observability" },
				]}
			/>
			{children}
		</>
	);
}
