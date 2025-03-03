import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { setLanguage } from "@/app/i18n/i18n";
import * as Localization from "expo-localization";

type LanguageContextType = {
	locale: string;
	setLocale: (locale: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

const STORAGE_KEY = "@language";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [locale, setLocaleState] = useState(i18n.locale);

	useEffect(() => {
		const loadSavedLanguage = async () => {
			try {
				const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);

				if (savedLanguage) {
					setLanguage(savedLanguage);
					setLocaleState(savedLanguage);
				} else {
					const deviceLang = Localization.locale.slice(0, 2);
					const supportedLocales = ["en", "hr"];
					const finalLocale = supportedLocales.includes(deviceLang)
						? deviceLang
						: "en";

					setLanguage(finalLocale);
					setLocaleState(finalLocale);
					await AsyncStorage.setItem(STORAGE_KEY, finalLocale);
				}
			} catch (error) {
				console.error("Failed to load language:", error);
				setLanguage("en");
				setLocaleState("en");
			}
		};

		loadSavedLanguage();
	}, []);

	const setLocale = async (newLocale: string) => {
		try {
			setLanguage(newLocale);
			setLocaleState(newLocale);
			await AsyncStorage.setItem(STORAGE_KEY, newLocale);
		} catch (error) {
			console.error("Failed to set language:", error);
		}
	};

	return (
		<LanguageContext.Provider value={{ locale, setLocale }}>
			{children}
		</LanguageContext.Provider>
	);
};

export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
};

export const useTranslation = () => {
	useLanguage();

	return {
		t: (key: string, options?: object) => i18n.t(key, options),
	};
};
