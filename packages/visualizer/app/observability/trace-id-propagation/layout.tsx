import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Trace ID Propagation — Interactive Visualization",
	description:
		"Learn distributed tracing: propagate a unique trace ID across service boundaries to correlate logs and spans.",
	keywords: [
		"trace ID",
		"distributed tracing",
		"span",
		"correlation",
		"observability",
		"distributed systems",
	],
	alternates: { canonical: "/observability/trace-id-propagation" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Trace ID Propagation"
				description="Interactive visualization of trace ID propagation across services."
				path="/observability/trace-id-propagation"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Observability", href: "/observability" },
					{
						name: "Trace ID Propagation",
						href: "/observability/trace-id-propagation",
					},
				]}
			/>
			{children}
		</>
	);
}
