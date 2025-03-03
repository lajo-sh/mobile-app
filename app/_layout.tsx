import { useEffect } from "react";
import { useAuth, AuthProvider } from "@/components/AuthProvider";
import { Text } from "react-native";
import { router, Stack, usePathname } from "expo-router";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

import * as Notifications from "expo-notifications";

import "./styles/globals.css";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		priority: Notifications.AndroidNotificationPriority.HIGH,
	}),
});

export default function Layout() {
	useEffect(() => {
		const receivedSubscription = Notifications.addNotificationReceivedListener(
			(notification) => {
				const { title, body, data } = notification.request.content;
				console.log("Received notification:", { title, body, data });
			},
		);

		const responseSubscription =
			Notifications.addNotificationResponseReceivedListener((response) => {
				const { data } = response.notification.request.content;
				console.log("Notification tapped:", data);

				if (
					data?.code &&
					response.notification.request.content.title?.includes(
						"Phishing Alert",
					)
				) {
					router.push({
						pathname: "/phishing-alert",
						params: {
							code: data.code,
							url: data.url || "",
						},
					});
				}
			});

		return () => {
			receivedSubscription.remove();
			responseSubscription.remove();
		};
	}, []);

	return (
		<LanguageProvider>
			<ThemeProvider>
				<AuthProvider>
					<RootLayoutNav />
				</AuthProvider>
			</ThemeProvider>
		</LanguageProvider>
	);
}

function RootLayoutNav() {
	const auth = useAuth();
	const route = usePathname();

	useEffect(() => {
		if (auth.isLoading) {
			return;
		}

		if (route.startsWith("/phishing-alert")) {
			return;
		}

		if (!auth.isAuthenticated && !route.startsWith("/(auth)/login")) {
			router.push("/(auth)/login");
		}
	}, [auth.isLoading, auth.isAuthenticated, route]);

	if (auth.isLoading) {
		return (
			<ThemeProvider>
				<Text className="text-white">Loading...</Text>
			</ThemeProvider>
		);
	}

	return (
		<Stack>
			<Stack.Screen options={{ headerShown: false }} name="(tabs)" />
			<Stack.Screen options={{ headerShown: false }} name="(auth)/login" />
			<Stack.Screen
				options={{
					headerShown: true,
					headerStyle: { backgroundColor: "#111112" },
					headerTintColor: "#f3f3f3",
				}}
				name="phishing-alert"
			/>
		</Stack>
	);
}
