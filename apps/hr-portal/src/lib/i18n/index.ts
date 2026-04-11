import { browser } from '$app/environment';
import { init, register, locale } from 'svelte-i18n';

const defaultLocale = 'en';
const localeKey = 'locale';

function readStoredLocale(): string | null {
	if (!browser) return null;
	const v = localStorage.getItem(localeKey);
	return v === 'en' || v === 'my' ? v : null;
}

function initialLocale(): string {
	const saved = readStoredLocale();
	if (saved) return saved;
	if (!browser) return defaultLocale;
	const nav = window.navigator.language?.split('-')[0]?.toLowerCase();
	if (nav === 'my') return 'my';
	return defaultLocale;
}

register('en', () => import('./locales/en.json'));
register('my', () => import('./locales/my.json'));

init({
	fallbackLocale: defaultLocale,
	initialLocale: initialLocale(),
});

if (browser) {
	locale.subscribe((l) => {
		if (l) localStorage.setItem(localeKey, l);
	});
}

export { locale, t } from 'svelte-i18n';
