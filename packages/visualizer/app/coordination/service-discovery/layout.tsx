import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Service Discovery — Interactive Visualization",
	description:
		"Learn Service Discovery: query the registry to find healthy service instances dynamically.",
	keywords: [
		"service discovery",
		"client-side discovery",
		"server-side discovery",
		"load balancing",
		"distributed systems",
	],
	alternates: { canonical: "/coordination/service-discovery" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Service Discovery"
				description="Interactive visualization of service discovery patterns."
				path="/coordination/service-discovery"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Coordination", href: "/coordination" },
					{
						name: "Service Discovery",
						href: "/coordination/service-discovery",
					},
				]}
			/>
			{children}
		</>
	);
}
