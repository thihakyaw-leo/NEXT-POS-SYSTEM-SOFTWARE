<script lang="ts">
  import { t, locale } from '$lib/i18n';
  import {
    LayoutDashboard,
    Users,
    Clock,
    CreditCard,
    UserPlus,
    Target,
    User,
    GraduationCap,
    BarChart,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    LogOut,
  } from '@lucide/svelte';
  import { page } from '$app/stores';
  import { branding } from '$lib/stores/branding';

  let collapsed = false;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, path: '/', label: 'common.dashboard' },
    { id: 'employees', icon: Users, path: '/employees', label: 'common.employees' },
    { id: 'attendance', icon: Clock, path: '/attendance', label: 'common.attendance' },
    { id: 'payroll', icon: CreditCard, path: '/payroll', label: 'common.payroll' },
    { id: 'recruitment', icon: UserPlus, path: '/recruitment', label: 'common.recruitment' },
    { id: 'performance', icon: Target, path: '/performance', label: 'common.performance' },
    { id: 'selfservice', icon: User, path: '/self-service', label: 'common.selfservice' },
    { id: 'learning', icon: GraduationCap, path: '/learning', label: 'common.learning' },
    { id: 'analytics', icon: BarChart, path: '/analytics', label: 'common.analytics' },
    { id: 'admin', icon: ShieldAlert, path: '/admin', label: 'common.admin' },
  ];

  function handleLogout() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
</script>

<aside
  class="h-screen bg-slate-900 border-r border-white/10 transition-all duration-300 flex flex-col text-white {collapsed
    ? 'w-20'
    : 'w-72'} dark:bg-slate-950 dark:border-slate-800"
>
  <div class="px-6 py-8 flex items-center justify-between">
    {#if !collapsed}
      <div class="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 overflow-hidden min-w-0">
        {#if $branding.logoUrl}
          <img src={$branding.logoUrl} alt="Logo" class="w-10 h-10 rounded-lg object-contain shrink-0" />
        {:else}
          <div
            class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-black text-white text-xl shadow-lg shadow-accent/20 shrink-0"
          >
            {$branding.companyName[0]}
          </div>
        {/if}
        <span
          class="font-black text-white tracking-tighter text-lg truncate {$locale === 'my' ? 'leading-snug' : ''}"
          >{$branding.companyName}</span
        >
      </div>
    {:else}
      {#if $branding.logoUrl}
        <img src={$branding.logoUrl} alt="Logo" class="w-10 h-10 rounded-lg object-contain mx-auto" />
      {:else}
        <div class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-black text-white text-xl mx-auto">
          {$branding.companyName[0]}
        </div>
      {/if}
    {/if}
  </div>

  <nav class="flex-1 px-4 space-y-2 overflow-y-auto">
    {#each menuItems as item}
      {@const isActive = $page.url.pathname === item.path}
      <a
        href={item.path}
        class="flex items-center gap-4 px-4 py-3 rounded-xl transition-all group {isActive
          ? 'bg-accent text-white shadow-lg shadow-accent/20'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'}"
      >
        <svelte:component
          this={item.icon}
          size={20}
          class={isActive ? 'text-white' : 'group-hover:text-accent transition-colors'}
        />
        {#if !collapsed}
          <span class="text-sm font-bold tracking-tight {$locale === 'my' ? 'leading-relaxed' : ''}"
            >{$t(item.label)}</span
          >
        {/if}
      </a>
    {/each}
  </nav>

  <div class="p-4 border-t border-white/5 space-y-2">
    <button
      type="button"
      on:click={handleLogout}
      class="w-full h-12 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-all group"
    >
      <LogOut size={20} class="group-hover:rotate-12 transition-transform shrink-0" />
      {#if !collapsed}
        <span class="text-xs font-black uppercase tracking-widest ml-4 text-left {$locale === 'my' ? 'leading-relaxed normal-case font-bold' : ''}"
          >{$t('sidebar.terminate_session')}</span
        >
      {/if}
    </button>

    <button
      type="button"
      on:click={() => (collapsed = !collapsed)}
      class="w-full h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
      title={collapsed ? $t('sidebar.expand') : $t('sidebar.collapse')}
    >
      {#if collapsed}
        <ChevronRight size={18} />
      {:else}
        <div class="flex items-center gap-2">
          <ChevronLeft size={18} />
          <span class="text-[10px] font-bold uppercase tracking-widest">{$t('sidebar.collapse')}</span>
        </div>
      {/if}
    </button>
  </div>
</aside>
