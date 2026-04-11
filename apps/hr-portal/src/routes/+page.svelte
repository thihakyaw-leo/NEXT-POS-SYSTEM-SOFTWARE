<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';
  import { 
    Users, Briefcase, CreditCard, 
    Target, TrendingUp, Bell, 
    Calendar, ArrowUpRight, Loader2,
    ShieldCheck
  } from '@lucide/svelte';
  import { fade, fly, slide } from 'svelte/transition';

  let stats = {
    employees: 0,
    jobs: 0,
    payroll: 0,
    performance: 0
  };
  let isLoading = true;

  onMount(async () => {
    // Fetch aggregated dashboard data
    const res = await apiFetch('/auth/analytics/summary');
    if (res.ok) {
       const data: any = await res.json();
       stats = {
         employees: data.activeEmployees,
         jobs: 4, // Mock for recruitment
         payroll: 128000000, // Total net
         performance: 12
       };
    }
    isLoading = false;
  });
</script>

<div class="space-y-12 pb-20" in:fade>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none dark:text-slate-100">Command Center</h1>
      <p class="text-slate-500 font-medium italic mt-2 dark:text-slate-400">Enterprise-wide operational intelligence & workforce signals.</p>
    </div>
    <div class="flex items-center gap-3">
       <div class="p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm dark:bg-emerald-950/40 dark:text-emerald-400">
          <ShieldCheck size={18} /> System Integrity: Optimal
       </div>
    </div>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-20 gap-3 text-slate-400 font-bold italic">
       <Loader2 class="animate-spin text-accent" size={24} /> Synchronizing nodes...
    </div>
  {:else}
    <!-- Master Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
       {#each [
          { label: 'Workforce', value: stats.employees, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Open Positions', value: stats.jobs, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Payroll Velocity', value: (stats.payroll / 1000000).toFixed(1) + 'M', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Active Goals', value: stats.performance, icon: Target, color: 'text-rose-500', bg: 'bg-rose-50' }
       ] as metric}
          <div class="glass-panel p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4 hover:scale-105 transition-all group dark:bg-slate-900/70 dark:border-slate-700/80 dark:shadow-slate-950/50">
             <div class="flex items-center justify-between">
                <div class="w-12 h-12 {metric.bg} {metric.color} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12">
                   <metric.icon size={22} />
                </div>
                <div class="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
                   <TrendingUp size={14} /> +2%
                </div>
             </div>
             <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                <h3 class="text-3xl font-black text-slate-900 tracking-tighter dark:text-slate-100">{metric.value}</h3>
             </div>
          </div>
       {/each}
    </div>

    <!-- Multi-Module Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
       <!-- Recruitment Pipeline -->
       <div class="lg:col-span-2 space-y-8">
          <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 dark:bg-slate-900/70 dark:border-slate-700/80">
             <div class="flex items-center justify-between">
                <h2 class="text-xl font-black uppercase tracking-tighter dark:text-slate-100">Talent Acquisition Pipeline</h2>
                <a href="/recruitment" class="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1 hover:underline">
                   Manager Portal <ArrowUpRight size={14} />
                </a>
             </div>
             
             <div class="grid grid-cols-3 gap-6">
                {#each [
                   { stage: 'Screening', count: 12, color: 'bg-blue-500' },
                   { stage: 'Interviews', count: 5, color: 'bg-indigo-500' },
                   { stage: 'Offer Sent', count: 2, color: 'bg-emerald-500' }
                ] as stage}
                   <div class="p-6 bg-slate-50 rounded-3xl space-y-3 relative overflow-hidden group dark:bg-slate-800/60">
                      <div class="absolute top-0 right-0 w-1 h-full {stage.color}"></div>
                      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stage.stage}</p>
                      <h4 class="text-4xl font-black text-slate-900 tracking-tighter dark:text-slate-100">{stage.count}</h4>
                   </div>
                {/each}
             </div>
          </div>

          <!-- Recent Activity Integrated -->
          <div class="space-y-6">
             <h2 class="text-xl font-black uppercase tracking-tighter pl-2 dark:text-slate-100">Real-time HR Signals</h2>
             <div class="space-y-4">
                {#each [
                   { user: 'Admin', action: 'Approved Leave Request', time: '2 mins ago', icon: Calendar, color: 'text-indigo-500' },
                   { user: 'System', action: 'Monthly Payroll Run Initiated', time: '1 hour ago', icon: CreditCard, color: 'text-emerald-500' },
                   { user: 'Talent', action: 'New Candidate for Senior Dev position', time: '3 hours ago', icon: Users, color: 'text-blue-500' }
                ] as activity}
                   <div class="p-6 bg-white border border-slate-50 rounded-[2rem] flex items-center justify-between hover:bg-slate-50 transition-colors shadow-sm dark:bg-slate-900/60 dark:border-slate-700/60 dark:hover:bg-slate-800/80">
                      <div class="flex items-center gap-6">
                         <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center dark:bg-slate-800 {activity.color}">
                            <activity.icon size={18} />
                         </div>
                         <div>
                            <p class="text-sm font-bold text-slate-900 italic leading-none dark:text-slate-100">{activity.action}</p>
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{activity.user} • {activity.time}</p>
                         </div>
                      </div>
                      <button class="p-2 text-slate-300 hover:text-accent">
                         <ArrowUpRight size={18} />
                      </button>
                   </div>
                {/each}
             </div>
          </div>
       </div>

       <!-- Side Panel: System Pulse -->
       <div class="space-y-10">
          <div class="bg-slate-900 p-10 rounded-[3rem] text-white space-y-10 relative overflow-hidden group">
             <div class="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl transform group-hover:scale-150 transition-transform duration-700"></div>
             <div class="space-y-2 relative z-10">
                <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Pulse</h3>
                <h4 class="text-2xl font-black tracking-tighter">System Health Status</h4>
             </div>
             
             <div class="space-y-6 relative z-10">
                {#each [
                   { label: 'Cloudflare Worker', status: 'Operational', color: 'text-emerald-500' },
                   { label: 'D1 Primary Cluster', status: 'Sync Active', color: 'text-emerald-500' },
                   { label: 'JWT Security Mesh', status: 'Enforced', color: 'text-accent' }
                ] as status}
                   <div class="flex items-center justify-between border-b border-white/5 pb-4">
                      <span class="text-[11px] font-bold text-slate-400">{status.label}</span>
                      <span class="text-[9px] font-black uppercase tracking-widest {status.color}">{status.status}</span>
                   </div>
                {/each}
             </div>

             <button class="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                Access Audit Logs
             </button>
          </div>

          <!-- Quick Actions -->
          <div class="p-8 bg-indigo-50 border border-indigo-100 rounded-[3rem] space-y-6 dark:bg-indigo-950/30 dark:border-indigo-900/40">
             <h3 class="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none dark:text-indigo-300">Intelligence Hub</h3>
             <p class="text-[11px] font-bold text-indigo-900 leading-relaxed italic dark:text-indigo-100">
               Cross-module data linkage is now active. Attendance cycles are automatically feeding into the live payroll engine.
             </p>
          </div>
       </div>
    </div>
  {/if}
</div>
