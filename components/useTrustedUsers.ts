import axios from "axios";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { useTranslation } from "./LanguageProvider";

interface TrustedUser {
	id: number;
	email: string;
	fullName: string | null;
}

export function useTrustedUsers() {
	const [trustedUsers, setTrustedUsers] = useState<TrustedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { session } = useAuth();
	const { t } = useTranslation();

	const tRef = useRef(t);
	useEffect(() => {
		tRef.current = t;
	}, [t]);

	const fetchTrustedUsers = useCallback(async () => {
		if (!session) {
			setError(tRef.current("authError"));
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			if (!process.env.EXPO_PUBLIC_BASE_URL) {
				throw new Error("API URL not configured");
			}

			const response = await axios.get(
				`${process.env.EXPO_PUBLIC_BASE_URL}/me/trusted-users`,
				{
					headers: {
						Authorization: `Bearer ${session}`,
					},
					timeout: 10000,
				},
			);

			if (!response.data || !Array.isArray(response.data.trustedUsers)) {
				throw new Error("Invalid response format");
			}

			setTrustedUsers(response.data.trustedUsers);
		} catch (err) {
			setTrustedUsers([]);
			handleError(err);
		} finally {
			setLoading(false);
		}
	}, [session]);

	const handleError = useCallback((err: unknown) => {
		if (axios.isAxiosError(err)) {
			if (err.code === "ECONNABORTED") {
				setError(tRef.current("networkError"));
				return;
			}

			if (err.response) {
				const statusCode = err.response.status;
				if (statusCode === 401 || statusCode === 403) {
					setError(tRef.current("authError"));
					return;
				}
				if (statusCode >= 500) {
					setError(tRef.current("serverError"));
					return;
				}
				setError(tRef.current("error"));
				return;
			}

			if (err.request) {
				setError(tRef.current("networkError"));
				return;
			}

			setError(tRef.current("error"));
			return;
		}

		setError(tRef.current("error"));
		console.error("Error fetching trusted users:", err);
	}, []);

	const addTrustedUser = useCallback(
		async (email: string) => {
			if (!session) {
				return { success: false, error: tRef.current("authError") };
			}

			if (!email || typeof email !== "string") {
				return { success: false, error: tRef.current("error") };
			}

			try {
				setError(null);

				if (!process.env.EXPO_PUBLIC_BASE_URL) {
					throw new Error("API URL not configured");
				}

				await axios.post(
					`${process.env.EXPO_PUBLIC_BASE_URL}/me/trusted-users`,
					{ email },
					{
						headers: {
							Authorization: `Bearer ${session}`,
						},
						timeout: 10000,
					},
				);

				await fetchTrustedUsers();
				return { success: true };
			} catch (err) {
				if (axios.isAxiosError(err)) {
					if (err.response?.status === 400) {
						if (err.response?.data?.error === "User not found") {
							const errorMsg = tRef.current("userNotFound");
							setError(errorMsg);
							return { success: false, error: errorMsg };
						}
						if (err.response?.data?.error === "User is already trusted") {
							const errorMsg = tRef.current("userAlreadyTrusted");
							setError(errorMsg);
							return { success: false, error: errorMsg };
						}
					}

					if (err.response?.status === 401 || err.response?.status === 403) {
						const errorMsg = tRef.current("authError");
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}

					if (err.code === "ECONNABORTED") {
						const errorMsg = tRef.current("networkError");
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}

					if (err.response) {
						const errorMsg = tRef.current("serverError");
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}

					if (err.request) {
						const errorMsg = tRef.current("networkError");
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}
				}

				const errorMsg = tRef.current("error");
				setError(errorMsg);
				console.error("Error adding trusted user:", err);
				return { success: false, error: errorMsg };
			}
		},
		[session, fetchTrustedUsers],
	);

	const removeTrustedUser = useCallback(
		async (userId: number) => {
			if (!session) {
				return { success: false, error: tRef.current("authError") };
			}

			if (!userId || typeof userId !== "number") {
				return { success: false, error: tRef.current("error") };
			}

			try {
				setError(null);

				if (!process.env.EXPO_PUBLIC_BASE_URL) {
					throw new Error("API URL not configured");
				}

				await axios.delete(
					`${process.env.EXPO_PUBLIC_BASE_URL}/me/trusted-users/${userId}`,
					{
						headers: {
							Authorization: `Bearer ${session}`,
						},
						timeout: 10000,
					},
				);

				await fetchTrustedUsers();
				return { success: true };
			} catch (err) {
				if (axios.isAxiosError(err)) {
					if (err.code === "ECONNABORTED") {
						const errorMsg = tRef.current("networkError");
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}

					if (err.response?.status === 401 || err.response?.status === 403) {
						const errorMsg = tRef.current("authError");
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}

					if (err.response) {
						const errorMsg = tRef.current("serverError");
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}

					if (err.request) {
						const errorMsg = tRef.current("networkError");
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}
				}

				const errorMsg = tRef.current("error");
				setError(errorMsg);
				console.error("Error removing trusted user:", err);
				return { success: false, error: errorMsg };
			}
		},
		[session, fetchTrustedUsers],
	);

	useEffect(() => {
		if (session) {
			fetchTrustedUsers().catch((err) => {
				console.error("Initial trusted users fetch failed:", err);
				setError(tRef.current("error"));
				setLoading(false);
			});
		} else {
			setLoading(false);
		}
	}, [session, fetchTrustedUsers]);

	return {
		trustedUsers,
		loading,
		error,
		fetchTrustedUsers,
		addTrustedUser,
		removeTrustedUser,
	};
}
