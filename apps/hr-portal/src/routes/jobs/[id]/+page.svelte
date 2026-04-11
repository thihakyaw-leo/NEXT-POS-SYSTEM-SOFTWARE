<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { 
    ArrowLeft, Send, CheckCircle, 
    Upload, Loader2, Info 
  } from '@lucide/svelte';
  import { fade, fly } from 'svelte/transition';

  let job = null;
  let isLoading = true;
  let applicant = { name: '', email: '', phone: '', resumeUrl: 'mock-r2-link' };
  let status = 'idle'; // idle, submitting, success

  onMount(async () => {
    const id = $page.params.id;
    const res = await fetch('http://localhost:8787/public/jobs');
    if (res.ok) {
        const jobs = await res.json();
        job = jobs.find(j => j.id === id);
    }
    isLoading = false;
  });

  async function handleApply() {
    status = 'submitting';
    const res = await fetch('http://localhost:8787/public/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: job.id,
        ...applicant
      })
    });

    if (res.ok) {
      status = 'success';
    } else {
      status = 'idle';
      alert("Application failed. Please try again.");
    }
  }
</script>

<div class="min-h-screen bg-white font-sans" in:fade>
  <nav class="bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between pointer-events-auto">
    <a href="/jobs" class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-accent transition-all">
      <ArrowLeft size={16} /> Back to Openings
    </a>
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-black text-white text-lg">N</div>
      <span class="font-black text-slate-900 tracking-tighter text-sm uppercase">Careers</span>
    </div>
  </nav>

  {#if isLoading}
    <div class="py-40 text-center text-slate-400 font-bold italic">Gathering role details...</div>
  {:else if job}
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 py-20 px-8">
      <!-- Role Details -->
      <div class="space-y-12">
        <div class="space-y-6">
          <div class="inline-flex px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent">
            {job.departmentId || 'General'}
          </div>
          <h1 class="text-5xl font-black tracking-tighter text-slate-900 leading-tight">{job.title}</h1>
          <p class="text-xl text-slate-500 font-medium leading-relaxed">{job.description}</p>
        </div>

        <div class="space-y-6">
           <h3 class="text-xs font-black uppercase tracking-widest text-slate-900 pb-2 border-b border-slate-100">Requirements</h3>
           <ul class="space-y-4">
              {#each (job.requirements?.split('\n') || ['Passion for technology', 'Team player', 'Problem solver']) as req}
                <li class="flex items-start gap-3 text-slate-600 font-medium">
                   <div class="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                   {req}
                </li>
              {/each}
           </ul>
        </div>

        <div class="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-6">
           <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-accent shadow-sm">
              <Info size={32} />
           </div>
           <div>
              <h4 class="text-sm font-black text-slate-900 uppercase tracking-tight">Recruitment Notice</h4>
              <p class="text-xs text-slate-500 font-bold leading-relaxed mt-1">
                Typical response time for this role is 3-5 business days. Only shortlisted candidates will be contacted.
              </p>
           </div>
        </div>
      </div>

      <!-- Application Form -->
      <div class="relative">
        <div class="sticky top-32 glass-panel p-12 rounded-[4rem] bg-white border-glow space-y-10 shadow-2xl shadow-slate-200/50">
          {#if status === 'success'}
            <div class="py-12 text-center space-y-6" in:fly={{ y: 20 }}>
               <div class="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                  <CheckCircle size={40} />
               </div>
               <div class="space-y-2">
                 <h2 class="text-3xl font-black tracking-tighter uppercase text-slate-900">Application Sent!</h2>
                 <p class="text-slate-500 font-medium italic text-lg">Thank you for your interest, {applicant.name}.</p>
               </div>
               <button on:click={() => status = 'idle'} class="text-accent text-[10px] font-black uppercase tracking-widest hover:underline">Apply for another role</button>
            </div>
          {:else}
            <div class="space-y-2">
              <h2 class="text-3xl font-black tracking-tighter uppercase">Apply for this role</h2>
              <p class="text-slate-400 text-sm font-bold uppercase tracking-widest">Submit your details below</p>
            </div>

            <form on:submit|preventDefault={handleApply} class="space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Identity</label>
                <input type="text" bind:value={applicant.name} required placeholder="e.g. THIHA KYAW" class="w-full h-14 bg-slate-50 rounded-2xl border-none px-6 font-bold text-slate-900" />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                 <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Node</label>
                    <input type="email" bind:value={applicant.email} required placeholder="name@domain.com" class="w-full h-14 bg-slate-50 rounded-2xl border-none px-6 font-bold text-slate-900" />
                 </div>
                 <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Protocol</label>
                    <input type="tel" bind:value={applicant.phone} required placeholder="+95 9..." class="w-full h-14 bg-slate-50 rounded-2xl border-none px-6 font-bold text-slate-900" />
                 </div>
              </div>

              <div class="space-y-2">
                 <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Resume / CV (PDF)</label>
                 <div class="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                    <Upload size={24} class="text-slate-300 group-hover:text-accent transition-colors" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-accent">Upload Document</span>
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={status === 'submitting'}
                class="w-full py-5 bg-accent text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:bg-accent/90 transition-all flex items-center justify-center gap-3"
              >
                {#if status === 'submitting'}
                   <Loader2 class="animate-spin" size={18} /> Processing Application...
                {:else}
                   <Send size={18} /> Transmit Application
                {/if}
              </button>

              <p class="text-[9px] text-center text-slate-400 font-bold leading-relaxed px-6">
                By submitting, you agree to our recruitment privacy protocols and data processing guidelines.
              </p>
            </form>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .border-glow {
    box-shadow: 0 0 80px -20px rgba(14, 165, 233, 0.15);
  }
</style>
