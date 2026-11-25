"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BackgroundSlideshow } from "@/components/background/BackgroundSlideshow";
import { Sidebar } from "@/components/Sidebar";
import { ActionFeedbackProvider } from "@/components/member/ActionFeedback";

const LOGIN_PATH = "/login";

type AppShellProps = {
	children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
	const pathname = usePathname();
	const isLogin = pathname === LOGIN_PATH;
	const isMusicAdmin = pathname.startsWith("/music-admin");
	const usesStandaloneShell = isLogin || isMusicAdmin;

	return (
		<ActionFeedbackProvider>
			{!usesStandaloneShell ? <BackgroundSlideshow /> : null}
			<div className={usesStandaloneShell ? "login-shell" : "app-shell"}>
				{!usesStandaloneShell ? <Sidebar /> : null}
				{usesStandaloneShell ? (
					<div className="login-main">{children}</div>
				) : (
					<main className="app-main">{children}</main>
				)}
			</div>
		</ActionFeedbackProvider>
	);
};
