import { createContext, useContext, useState, useEffect } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const storage = {
	async setItem(key: string, value: string) {
		try {
			if (Platform.OS === "web") {
				localStorage.setItem(key, value);
			} else {
				await SecureStore.setItemAsync(key, value);
			}
		} catch (error) {}
	},

	async getItem(key: string) {
		try {
			if (Platform.OS === "web") {
				return localStorage.getItem(key);
			}

			return await SecureStore.getItemAsync(key);
		} catch (error) {
			return null;
		}
	},

	async removeItem(key: string) {
		try {
			if (Platform.OS === "web") {
				localStorage.removeItem(key);
			} else {
				await SecureStore.deleteItemAsync(key);
			}
		} catch (error) {}
	},
};

const AuthContext = createContext({
	signIn: async (
		email: string,
		password: string,
	): Promise<{ success: boolean; error?: string }> => ({ success: false }),
	signOut: () => {},
	isAuthenticated: false,
	isLoading: true,
	userEmail: null as string | null,
	fullName: null as string | null,
	session: null as string | null,
});

export function AuthProvider({ children }: { children?: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [fullName, setFullName] = useState<string | null>(null);
	const [session, setSession] = useState<string | null>(null);

	useEffect(() => {
		const checkToken = async () => {
			try {
				const token = await storage.getItem("userToken");

				if (token) {
					const response = await fetch(
						`${process.env.EXPO_PUBLIC_BASE_URL}/auth/me`,
						{
							method: "GET",
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "application/json",
							},
						},
					);

					const data = await response.json();

					if (data.valid) {
						setIsAuthenticated(true);
						setUserEmail(data.user.email);
						setFullName(data.user.fullName);
						setSession(token);

						await storage.setItem("userEmail", data.email);
						await storage.setItem("fullName", data.fullName);
					} else {
						await signOut();
					}
				}
			} catch (error) {
				await signOut();
			}
			setIsLoading(false);
		};

		checkToken();
	}, []);

	const signIn = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`${process.env.EXPO_PUBLIC_BASE_URL}/auth/login`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email, password }),
				},
			);

			const data = await response.json();

			if (!data.success) {
				return {
					success: false,
					error: data.error,
				};
			}

			await storage.setItem("userToken", data.session);
			await storage.setItem("userEmail", email);
			await storage.setItem("fullName", data.fullName);

			setIsAuthenticated(true);
			setUserEmail(email);
			setFullName(data.fullName);
			setSession(data.session);

			router.replace("/");

			return {
				success: true,
			};
		} catch (error) {
			return {
				success: false,
				error: "An error occurred during authentication",
			};
		}
	};

	const signOut = async () => {
		setIsLoading(true);
		try {
			await storage.removeItem("userToken");
			await storage.removeItem("userEmail");
			await storage.removeItem("fullName");
			setIsAuthenticated(false);
			setUserEmail(null);
			setFullName(null);
			router.replace("/(auth)/login");
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				signIn,
				signOut,
				isAuthenticated,
				isLoading,
				userEmail,
				fullName,
				session,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
