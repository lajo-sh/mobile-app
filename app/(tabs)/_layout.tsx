import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useEffect } from "react";
import "expo-dev-client";
import { useTranslation } from "@/components/LanguageProvider";

export default function TabsLayout() {
	const { t } = useTranslation();

	useEffect(() => {
		async function main() {
			if (Platform.OS === "android") {
				await Notifications.setNotificationChannelAsync("phishing_notif", {
					name: t("phishingNotifChannel"),
					importance: Notifications.AndroidImportance.MAX,
					vibrationPattern: [0, 250, 250, 250],
					lightColor: "#FF231F7C",
					sound: "default",
					enableVibrate: true,
					showBadge: true,
				});
			}

			if (Device.isDevice) {
				const { status: existingStatus } =
					await Notifications.getPermissionsAsync();
				const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

				if (!projectId) {
					return;
				}

				try {
					const pushTokenString = (
						await Notifications.getExpoPushTokenAsync({ projectId })
					).data;

					console.log(pushTokenString);
				} catch (e: unknown) {}
			}
		}

		main();
	}, [t]);

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: "#111112",
					height: 70,
					borderTopWidth: 0,
				},
				tabBarActiveTintColor: "#f3f3f3",
				tabBarInactiveTintColor: "#c4c4c4",
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: t("home"),
					tabBarIcon: ({ focused, color }) => (
						<Ionicons name="home" size={24} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="settings"
				options={{
					title: t("settings"),
					tabBarIcon: ({ focused, color }) => (
						<Ionicons name="settings" size={24} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
