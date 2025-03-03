import { I18n } from "i18n-js";
import * as Localization from "expo-localization";

import en from "./translations/en";
import hr from "./translations/hr";

const i18n = new I18n({
	en,
	hr,
});

i18n.locale = Localization.locale.slice(0, 2);

i18n.enableFallback = true;
i18n.defaultLocale = "hr";

export const setLanguage = (locale: string) => {
	i18n.locale = locale;
};

export const getCurrentLocale = () => i18n.locale;

export default i18n;
