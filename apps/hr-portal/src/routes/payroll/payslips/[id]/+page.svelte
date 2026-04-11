<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { 
    Printer, Download, ArrowLeft, 
    Building2, User, CalendarDays, Wallet 
  } from '@lucide/svelte';
  import { fade } from 'svelte/transition';

  let entry = null;
  let isLoading = true;

  onMount(async () => {
    const id = $page.params.id;
    const res = await fetch(`http://localhost:8787/auth/payroll/entry/${id}`);
    if (res.ok) entry = await res.json();
    isLoading = false;
  });

  function handlePrint() {
    window.print();
  }
</script>

<div class="max-w-4xl mx-auto space-y-8 no-print" in:fade>
  <div class="flex items-center justify-between">
    <a href="/payroll" class="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-accent transition-all">
      <ArrowLeft size={16} /> Back to Dashboard
    </a>
    <div class="flex items-center gap-4">
      <button 
        on:click={handlePrint}
        class="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
      >
        <Printer size={18} /> Print Payslip
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="p-20 text-center text-slate-400 font-bold italic">Generating digital payslip...</div>
  {:else if entry}
    <!-- Actual Payslip Card -->
    <div id="payslip-content" class="bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden">
      <!-- Header Area -->
      <div class="p-12 bg-slate-50 flex justify-between items-start border-b border-slate-100">
        <div class="space-y-4">
          <div class="flex items-center gap-3 text-accent">
            <Building2 size={32} strokeWidth={2.5} />
            <h1 class="text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">NEXT HR <span class="text-accent underline decoration-4">PORTAL</span></h1>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Payment Order</p>
            <p class="text-base font-bold text-slate-900">Ref: PAY-{entry.id.split('-')[0].toUpperCase()}</p>
          </div>
        </div>
        <div class="text-right space-y-1">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Payment Period</p>
          <p class="text-xl font-black text-slate-900 tracking-tighter uppercase">
            {new Date(0, entry.month - 1).toLocaleString('default', { month: 'long' })} {entry.year}
          </p>
        </div>
      </div>

      <!-- Employee Info -->
      <div class="p-12 grid grid-cols-2 gap-12 border-b border-slate-100">
        <div class="flex gap-4">
           <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <User size={28} />
           </div>
           <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Employee Details</p>
              <h4 class="text-lg font-black text-slate-900 mt-1">{entry.employee.name}</h4>
              <p class="text-xs text-slate-500 font-bold">{entry.employee.internalId} • {entry.employee.role.toUpperCase()}</p>
           </div>
        </div>
        <div class="flex gap-4 justify-end text-right">
           <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Attendance Log</p>
              <h4 class="text-lg font-black text-slate-900 mt-1">{entry.daysPresent} / {entry.totalWorkingDays} Days</h4>
              <p class="text-xs text-emerald-500 font-black uppercase tracking-widest">Active Status</p>
           </div>
           <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <CalendarDays size={28} />
           </div>
        </div>
      </div>

      <!-- Breakdown Table -->
      <div class="p-12 space-y-10">
        <div class="space-y-6">
          <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Salary Breakdown</h5>
          <div class="space-y-4">
            <div class="flex justify-between items-center text-sm font-bold text-slate-600">
               <span>Basic Salary (Fixed Rate)</span>
               <span class="text-slate-900">{entry.baseSalary.toLocaleString()} MMK</span>
            </div>
            <div class="flex justify-between items-center text-sm font-bold text-slate-600">
               <span>Calculated Gross (Base × Attendance)</span>
               <span class="text-slate-900">{entry.grossWage.toLocaleString()} MMK</span>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <h5 class="text-[10px] font-black text-rose-400 uppercase tracking-widest border-b border-rose-50 pb-2">Deductions & Contributions</h5>
          <div class="space-y-4">
            <div class="flex justify-between items-center text-sm font-bold text-slate-600">
               <div class="flex items-center gap-2">
                  <span>Damage Repayment</span>
                  <span class="px-2 py-0.5 bg-rose-50 text-rose-500 rounded text-[9px] font-black">20% capped</span>
               </div>
               <span class="text-rose-500">- {entry.damageDeduction.toLocaleString()} MMK</span>
            </div>
            <div class="flex justify-between items-center text-sm font-bold text-slate-600">
               <span>SSB (Social Security Board)</span>
               <span class="text-rose-500">- {entry.ssDeduction.toLocaleString()} MMK</span>
            </div>
            <div class="flex justify-between items-center text-sm font-bold text-slate-600">
               <span>Income Tax</span>
               <span class="text-rose-500">- 0 MMK</span>
            </div>
          </div>
        </div>

        <!-- Total -->
        <div class="mt-12 p-10 bg-slate-900 rounded-3xl text-white flex justify-between items-center relative overflow-hidden">
           <div class="absolute inset-0 bg-accent/10 pointer-events-none" />
           <div class="space-y-1 relative z-10">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Disbursed Amount</p>
              <h3 class="text-3xl font-black tracking-tighter">Total Net Pay</h3>
           </div>
           <div class="text-right relative z-10">
              <h2 class="text-5xl font-black tracking-tighter text-accent">{entry.netWage.toLocaleString()} <span class="text-xl text-white/50 ml-1">MMK</span></h2>
           </div>
        </div>
        
        <div class="flex items-center gap-2 text-slate-400 mt-4 px-2">
           <Info size={14} />
           <p class="text-[9px] font-bold italic">
             Remaining Damage Balance after this payment: {entry.remainingDamageBalance.toLocaleString()} MMK. 
             This is a computer-generated payslip and does not require a physical signature.
           </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @media print {
    .no-print {
      display: none;
    }
    :global(body) {
      background: white !important;
    }
    :global(main) {
      padding: 0 !important;
    }
    #payslip-content {
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
  }
</style>
