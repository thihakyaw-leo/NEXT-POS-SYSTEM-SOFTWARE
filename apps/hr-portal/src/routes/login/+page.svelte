<script lang="ts">
  import { goto } from '$app/navigation';
  import { t } from '$lib/i18n';
  import { Shield, Key, User, Loader2, AlertCircle, Sun, Moon, Monitor } from '@lucide/svelte';
  import { fade, fly } from 'svelte/transition';
  import { themePreference, cycleTheme } from '$lib/stores/theme';

  let username = '';
  let password = '';
  let isLoading = false;
  let error = '';

  async function handleLogin() {
    isLoading = true;
    error = '';

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';
      const res = await fetch(`${apiBase}/public/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const raw = await res.text();
      let data: { token?: string; user?: unknown; error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          error = res.ok ? 'Invalid server response' : `Server error (${res.status})`;
          return;
        }
      }

      if (res.ok && data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
        localStorage.setItem('user', JSON.stringify(data.user));
        goto('/');
      } else {
        error = data.error || $t('login.error_auth');
      }
    } catch (e) {
      error =
        e instanceof TypeError
          ? `Cannot reach API at ${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787'} — start api-worker (npm run dev:api) and check CORS.`
          : $t('login.error_network');
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Login | NEXT HR</title>
</svelte:head>

<div
  class="fixed inset-0 flex items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50 dark:from-[#0a0f1a] dark:via-[#0f172a] dark:to-slate-900"
>
  <div
    class="absolute top-6 right-6 z-20 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-md dark:border-slate-600/50 dark:bg-slate-900/80"
  >
    <button
      type="button"
      title={$themePreference === 'light'
        ? $t('header.theme_light')
        : $themePreference === 'dark'
          ? $t('header.theme_dark')
          : $t('header.theme_system')}
      on:click={cycleTheme}
      class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {#if $themePreference === 'light'}
        <Sun size={20} class="text-amber-500" />
      {:else if $themePreference === 'dark'}
        <Moon size={20} class="text-sky-400" />
      {:else}
        <Monitor size={20} />
      {/if}
    </button>
  </div>

  <div class="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-accent/15 blur-[120px] dark:bg-accent/25"></div>
  <div
    class="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-500/20"
  ></div>

  <div class="relative w-full max-w-lg" in:fly={{ y: 20, duration: 1000 }}>
    <div
      class="glass-panel relative overflow-hidden rounded-[3.5rem] border border-slate-200/80 p-12 shadow-xl dark:border-white/10 dark:shadow-2xl"
    >
      <div class="absolute right-0 top-0 p-8 opacity-[0.07] dark:opacity-10">
        <Shield size={120} class="text-slate-900 dark:text-white" />
      </div>

      <div class="relative space-y-10">
        <div class="space-y-4 text-center">
          <div class="mb-2 inline-flex rounded-2xl bg-accent/10 p-4 text-accent">
            <Shield size={32} />
          </div>
          <h1
            class="text-3xl font-black uppercase tracking-tighter text-slate-900 sm:text-4xl dark:text-white"
          >
            {$t('login.title')}
          </h1>
          <p class="font-medium text-slate-600 dark:text-slate-400">
            {$t('login.subtitle')}
          </p>
        </div>

        {#if error}
          <div
            class="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-bold text-red-600 dark:text-red-400"
            in:fade
          >
            <AlertCircle size={18} />
            {error}
          </div>
        {/if}

        <form on:submit|preventDefault={handleLogin} class="space-y-6">
          <div class="space-y-2">
            <label
              for="username"
              class="pl-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
              >{$t('login.username')}</label
            >
            <div class="group relative">
              <User
                class="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-accent dark:text-slate-500"
                size={20}
              />
              <input
                id="username"
                type="text"
                bind:value={username}
                placeholder={$t('login.username_placeholder')}
                class="h-16 w-full rounded-[1.5rem] border border-slate-200/90 bg-white pl-16 pr-6 font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 dark:border-white/10 dark:bg-slate-900/60 dark:text-white dark:placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label
              for="password"
              class="pl-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
              >{$t('login.password')}</label
            >
            <div class="group relative">
              <Key
                class="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-accent dark:text-slate-500"
                size={20}
              />
              <input
                id="password"
                type="password"
                bind:value={password}
                placeholder={$t('login.password_placeholder')}
                class="h-16 w-full rounded-[1.5rem] border border-slate-200/90 bg-white pl-16 pr-6 font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 dark:border-white/10 dark:bg-slate-900/60 dark:text-white dark:placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            class="flex h-16 w-full items-center justify-center gap-3 rounded-[1.5rem] bg-accent text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {#if isLoading}
              <Loader2 class="animate-spin" size={20} />
              {$t('login.submit_loading')}
            {:else}
              {$t('login.submit')}
            {/if}
          </button>
        </form>

        <div class="border-t border-slate-200/80 pt-6 text-center dark:border-white/10">
          <p
            class="text-[10px] font-bold uppercase leading-relaxed tracking-widest text-slate-500 dark:text-slate-500"
          >
            {$t('login.footer')}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
