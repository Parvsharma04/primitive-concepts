import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
export const metadata: Metadata = {
	title: "Service Registry — Interactive Visualization",
	description:
		"Learn Service Registry: a central catalog where services register endpoints for dynamic discovery.",
	keywords: [
		"service registry",
		"service catalog",
		"microservices",
		"registration",
		"distributed systems",
	],
	alternates: { canonical: "/coordination/service-registry" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<JsonLd
				title="Service Registry"
				description="Interactive visualization of service registration and deregistration."
				path="/coordination/service-registry"
				breadcrumbs={[
					{ name: "Home", href: "/" },
					{ name: "Coordination", href: "/coordination" },
					{ name: "Service Registry", href: "/coordination/service-registry" },
				]}
			/>
			{children}
		</>
	);
}
