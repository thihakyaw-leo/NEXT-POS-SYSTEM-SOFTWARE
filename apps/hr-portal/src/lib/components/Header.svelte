<script lang="ts">
  import { locale, t } from '$lib/i18n';
  import { Bell, Search, Globe, User, Sun, Moon, Monitor } from '@lucide/svelte';
  import { branding } from '$lib/stores/branding';
  import { themePreference, cycleTheme } from '$lib/stores/theme';

  function toggleLanguage() {
    locale.update((l) => (l === 'en' ? 'my' : 'en'));
  }
</script>

<header
  class="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between z-10 dark:bg-slate-900/90 dark:border-slate-700/80"
>
  <div class="relative w-96 max-w-[40vw] group">
    <Search
      class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors dark:text-slate-500"
      size={18}
    />
    <input
      type="text"
      placeholder={$t('header.search_placeholder')}
      class="w-full h-11 bg-slate-100/80 border-none rounded-xl pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-accent/20 transition-all dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
    />
  </div>

  <div class="flex items-center gap-4 shrink-0">
    <button
      type="button"
      title={$themePreference === 'light'
        ? $t('header.theme_light')
        : $themePreference === 'dark'
          ? $t('header.theme_dark')
          : $t('header.theme_system')}
      on:click={cycleTheme}
      class="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-slate-600 dark:border-slate-600 dark:hover:bg-slate-800 dark:text-slate-300"
    >
      {#if $themePreference === 'light'}
        <Sun size={18} class="text-amber-500" />
      {:else if $themePreference === 'dark'}
        <Moon size={18} class="text-sky-400" />
      {:else}
        <Monitor size={18} class="text-slate-500 dark:text-slate-400" />
      {/if}
    </button>

    <button
      type="button"
      title={$t('header.language')}
      on:click={toggleLanguage}
      class="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-tighter text-slate-700 dark:border-slate-600 dark:hover:bg-slate-800 dark:text-slate-200"
    >
      <Globe size={16} class="text-accent shrink-0" />
      {$locale === 'en' ? 'မြန်မာ' : 'English'}
    </button>

    <div class="w-px h-8 bg-slate-200 dark:bg-slate-600 hidden sm:block"></div>

    <button
      type="button"
      class="relative p-2 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-xl transition-all dark:text-slate-500"
    >
      <Bell size={20} />
      <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
    </button>

    <div class="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-700">
      <div class="text-right hidden sm:block">
        <p class="text-xs font-black text-slate-900 uppercase dark:text-slate-100">
          {$t('header.role_admin')}
        </p>
        <p class="text-[10px] text-slate-400 font-bold dark:text-slate-500">
          {$t('header.role_sub')}
        </p>
      </div>
      <div
        class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg dark:bg-accent dark:text-white"
      >
        <User size={20} />
      </div>
    </div>
  </div>
</header>
