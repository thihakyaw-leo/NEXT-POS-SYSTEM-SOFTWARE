<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  import { 
    User, Briefcase, FileText, Settings, 
    Mail, Phone, MapPin, Calendar 
  } from '@lucide/svelte';
  import { fade } from 'svelte/transition';

  const employeeId = $page.params.id;
  let employee = null;
  let activeTab = 'overview';
  let loading = true;

  onMount(async () => {
    // In a real app, we'd fetch from the API worker
    const res = await fetch(`http://localhost:8787/auth/employees?id=${employeeId}`, {
      headers: { 'Authorization': 'Bearer placeholder-token' }
    });
    const data = await res.json();
    employee = data[0]; // Simplified
    loading = false;
  });

  const tabs = [
    { id: 'overview', icon: User, label: 'Overview' },
    { id: 'employment', icon: Briefcase, label: 'Employment' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];
</script>

{#if loading}
  <div class="flex items-center justify-center h-96">
    <p class="font-bold text-slate-400 animate-pulse">Synchronizing Profile Data...</p>
  </div>
{:else if employee}
  <div class="space-y-8" in:fade>
    <!-- Profile Header -->
    <div class="glass-panel p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 border-glow bg-white/40">
      <div class="w-32 h-32 rounded-[2rem] bg-accent/20 flex items-center justify-center text-accent font-black text-4xl shadow-xl shadow-accent/10 border-2 border-white">
        {employee.name.split(' ').map(n => n[0]).join('')}
      </div>
      
      <div class="flex-1 space-y-4 text-center md:text-left">
        <div>
          <h1 class="text-4xl font-black tracking-tighter text-slate-900 uppercase">{employee.name}</h1>
          <p class="text-slate-500 font-bold uppercase tracking-widest text-xs">{employee.role} • {employee.internalId}</p>
        </div>
        
        <div class="flex flex-wrap justify-center md:justify-start gap-4">
          <div class="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-100">
            <Mail size={16} class="text-accent" /> {employee.email || 'N/A'}
          </div>
          <div class="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-100">
            <Phone size={16} class="text-accent" /> {employee.phone || 'N/A'}
          </div>
        </div>
      </div>

      <button class="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
        Edit Profile
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      {#each tabs as tab}
        <button 
          on:click={() => activeTab = tab.id}
          class="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all {activeTab === tab.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}"
        >
          <svelte:component this={tab.icon} size={16} />
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Tab Content -->
    <div class="glass-panel p-10 rounded-[2.5rem] bg-white/20 min-h-[400px]">
      {#if activeTab === 'overview'}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="space-y-6">
            <h3 class="text-xl font-black tracking-tight flex items-center gap-3">
              <User size={20} class="text-accent" /> Personal Information
            </h3>
            <div class="grid gap-4">
              <div class="p-4 bg-white/50 rounded-2xl border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">NRC Number</p>
                <p class="font-bold text-slate-900">{employee.nrcNumber || 'Pending Verification'}</p>
              </div>
              <div class="p-4 bg-white/50 rounded-2xl border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Address</p>
                <p class="font-bold text-slate-900">{employee.address || 'Not Provided'}</p>
              </div>
            </div>
          </div>
          
          <div class="space-y-6">
            <h3 class="text-xl font-black tracking-tight flex items-center gap-3">
              <Calendar size={20} class="text-accent" /> Date of Birth
            </h3>
            <div class="p-4 bg-white/50 rounded-2xl border border-slate-100">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">DOB</p>
              <p class="font-bold text-slate-900">{employee.dob ? new Date(employee.dob).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center h-full text-slate-400 py-20 italic">
          <p>Tab content for {activeTab} is being synchronized...</p>
        </div>
      {/if}
    </div>
  </div>
{/if}
