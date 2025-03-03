import { Image, View, Text } from "react-native";
import Logo from "@/assets/images/icon.png";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LanguageProvider";

export default function Index() {
	const auth = useAuth();
	const { t } = useTranslation();
	const [blockedCount, setBlockedCount] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				if (!auth.session) {
					console.log("No auth session available");
					return;
				}

				setError(null);
				const response = await fetch(
					`${process.env.EXPO_PUBLIC_BASE_URL}/auth/me`,
					{
						headers: {
							Authorization: `Bearer ${auth.session}`,
						},
					},
				);

				if (!response.ok) {
					throw new Error(`Server responded with status: ${response.status}`);
				}

				const data = await response.json();

				if (!data || !data.user) {
					throw new Error("Invalid response format");
				}

				setBlockedCount(data.user.blockedWebsites || 0);
			} catch (error) {
				console.error("Error fetching user stats:", error);
				setError(t("fetchStatsError"));
				setBlockedCount((prev) => prev);
			}
		};

		fetchStats();
	}, [auth.session, t]);

	return (
		<ThemeProvider>
			<View className="flex-1 items-center justify-center bg-primary-background">
				<Image source={Logo} className="w-14 h-14" />
				<Text className="text-2xl text-white mt-4">
					{t("welcomeBack", { name: auth.fullName || t("user") })}
				</Text>
				<Text className="text-lg text-gray-300 mt-4">
					{t("blockedSitesCount", { count: blockedCount })}
				</Text>
				{error && <Text className="text-red-400 mt-2 text-sm">{error}</Text>}
			</View>
		</ThemeProvider>
	);
}
