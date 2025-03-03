import { TextInput, View, Image, type TextInputProps } from "react-native";
import { Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import Logo from "@/assets/images/icon.png";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

function Input(props: TextInputProps) {
	return (
		<TextInput
			{...props}
			className="w-full text-text placeholder:text-text bg-tertiary-background rounded-lg text-lg p-4"
		/>
	);
}

export default function Login() {
	const auth = useAuth();
	const { t } = useTranslation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	return (
		<View className="bg-primary-background flex-1 justify-center items-center">
			<View className="w-full max-w-sm gap-4 p-6 mx-4 rounded-lg items-center bg-secondary-background">
				<Image source={Logo} className="w-16 h-16" />
				<Input
					placeholder={t("email")}
					onChangeText={(text) => {
						setEmail(text);
					}}
					value={email}
				/>
				<Input
					placeholder={t("password")}
					onChangeText={(text) => {
						setPassword(text);
					}}
					value={password}
					secureTextEntry
				/>
				<TouchableOpacity
					onPress={async () => {
						const res = await auth.signIn(email, password);
						if (res.error) {
							setError(res.error);
						}
					}}
					className="w-full p-4 bg-accent rounded-lg justify-center items-center"
				>
					<Text className="text-white text-lg">{t("login")}</Text>
				</TouchableOpacity>
				{error && <Text className="text-red-500">{error}</Text>}
			</View>
		</View>
	);
}
