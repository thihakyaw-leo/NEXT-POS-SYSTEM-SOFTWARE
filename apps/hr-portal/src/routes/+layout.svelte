<script lang="ts">
  import '../app.css';
  import { locale } from '$lib/i18n';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { page } from '$app/stores';
  import { initBranding } from '$lib/stores/branding';
  import { initTheme } from '$lib/stores/theme';

  onMount(() => {
    initBranding();
    initTheme();

    const applyDocumentLang = (l: string | null | undefined) => {
      if (l == null || l === '') return;
      const isMy = l === 'my';
      document.documentElement.lang = isMy ? 'my' : 'en';
      document.documentElement.classList.toggle('locale-my', isMy);
    };

    applyDocumentLang(get(locale));
    const unsub = locale.subscribe(applyDocumentLang);
    return unsub;
  });

  $: isLoginPage = $page.url.pathname === '/login';
</script>

{#if isLoginPage}
  <main class="h-screen bg-slate-100 dark:bg-slate-950">
    <slot />
  </main>
{:else}
  <div
    class="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
  >
    <Sidebar />

    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-10">
        <slot />
      </main>
    </div>
  </div>
{/if}

<style>
  :global(.glass-panel) {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(148, 163, 184, 0.35);
  }

  :global(.dark .glass-panel) {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(148, 163, 184, 0.12);
  }
</style>
