import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "@/components/LanguageProvider";

export default function PhishingAlertScreen() {
	const { t } = useTranslation();
	const { code, url } = useLocalSearchParams<{ code: string; url: string }>();

	return (
		<>
			<Stack.Screen options={{ title: t("phishingAlert") }} />

			<View className="p-5 flex-1 justify-center bg-primary-background">
				<Text className="text-2xl font-bold text-red-500 mb-4 text-center">
					{t("phishingDetected")}
				</Text>
				<Text className="text-base text-text mb-6 text-center leading-6">
					{t("trustedUserNotified")}
				</Text>

				<Text className="mb-5 text-sm text-text text-center">
					{t("suspiciousUrl")}: <Text className="font-bold">{url}</Text>
				</Text>

				<View className="my-5 items-center p-4 bg-secondary-background rounded-lg">
					<Text className="text-base text-text font-bold mb-3">
						{t("verificationCode")}
					</Text>
					<View className="my-4">
						<Text className="text-3xl text-text font-bold tracking-widest">
							{code}
						</Text>
					</View>
				</View>
			</View>
		</>
	);
}
