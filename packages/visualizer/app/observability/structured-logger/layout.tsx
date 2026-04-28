import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Structured Logger — Interactive Visualization",
	description:
		"Learn structured logging: emit JSON log lines with consistent fields for machine-parseable logs.",
	keywords: [
		"structured logging",
		"JSON logs",
		"log levels",
		"observability",
		"distributed systems",
	],
	alternates: { canonical: "/observability/structured-logger" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Structured Logger"
				description="Interactive visualization of structured JSON logging."
				path="/observability/structured-logger"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Observability", href: "/observability" },
					{
						name: "Structured Logger",
						href: "/observability/structured-logger",
					},
				]}
			/>
			{children}
		</>
	);
}
