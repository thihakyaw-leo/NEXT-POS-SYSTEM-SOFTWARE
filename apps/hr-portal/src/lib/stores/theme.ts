import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';

export type ThemePreference = 'light' | 'dark' | 'system';

const storageKey = 'theme-preference';

export function isDarkMode(pref: ThemePreference): boolean {
	if (!browser) return false;
	if (pref === 'dark') return true;
	if (pref === 'light') return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(pref: ThemePreference) {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', isDarkMode(pref));
}

const stored = browser ? localStorage.getItem(storageKey) : null;
const initial: ThemePreference =
	stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';

export const themePreference = writable<ThemePreference>(initial);

let inited = false;

/** Call once from root layout onMount (client). */
export function initTheme() {
	if (!browser || inited) return;
	inited = true;
	apply(get(themePreference));
	themePreference.subscribe((p) => {
		localStorage.setItem(storageKey, p);
		apply(p);
	});
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (get(themePreference) === 'system') apply('system');
	});
}

export function cycleTheme() {
	themePreference.update((p) => (p === 'light' ? 'dark' : p === 'dark' ? 'system' : 'light'));
}
