<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { 
    GitGraph, MoreVertical, Plus, 
    ChevronDown, ChevronRight, GripVertical 
  } from '@lucide/svelte';
  import { fade, slide } from 'svelte/transition';

  let departments = [];
  let loading = true;

  onMount(async () => {
    await fetchDepartments();
    loading = false;
  });

  async function fetchDepartments() {
    const res = await fetch('http://localhost:8787/auth/departments', {
      headers: { 'Authorization': 'Bearer placeholder-token' }
    });
    departments = await res.json();
  }

  // Recursive Tree Component logic
  function getChildren(id) {
    return departments.filter(d => d.parentId === id);
  }

  // Drag and Drop Logic (Simplified for the demonstration)
  let draggedId = null;

  function handleDragStart(id) {
    draggedId = id;
  }

  async function handleDrop(targetParentId) {
    if (draggedId === targetParentId) return;
    
    const res = await fetch(`http://localhost:8787/auth/departments/${draggedId}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': 'Bearer placeholder-token',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ parentId: targetParentId })
    });

    if (res.ok) {
      await fetchDepartments();
    }
    draggedId = null;
  }
</script>

<div class="space-y-8" in:fade>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-black tracking-tighter uppercase">Organization Chart</h1>
      <p class="text-slate-500 font-medium">Visualize and manage your company hierarchy.</p>
    </div>
    <button class="btn-primary flex items-center gap-2">
      <Plus size={18} /> New Department
    </button>
  </div>

  <div class="glass-panel p-10 rounded-[2.5rem] min-h-[600px] border-glow bg-white/40">
    {#if loading}
      <p>Loading architecture...</p>
    {:else}
      <div class="space-y-4">
        {#each departments.filter(d => !d.parentId) as rootDept}
          <div 
            class="tree-node"
            draggable="true" 
            on:dragstart={() => handleDragStart(rootDept.id)}
            on:dragover|preventDefault
            on:drop={() => handleDrop(rootDept.id)}
          >
            <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 text-white shadow-xl">
              <GripVertical size={16} class="text-slate-600 cursor-move" />
              <span class="text-sm font-black uppercase tracking-widest">{rootDept.name}</span>
              <div class="flex-1" />
              <button class="p-1 hover:text-accent transition-colors"><Plus size={16} /></button>
            </div>

            <!-- Recursive Children -->
            <div class="pl-12 mt-4 space-y-4 border-l-2 border-slate-200">
              {#each getChildren(rootDept.id) as child}
                <div 
                  class="tree-node-child"
                  draggable="true"
                  on:dragstart|stopPropagation={() => handleDragStart(child.id)}
                  on:dragover|preventDefault
                  on:drop|stopPropagation={() => handleDrop(child.id)}
                >
                  <div class="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-accent transition-all group">
                    <GripVertical size={16} class="text-slate-300 cursor-move group-hover:text-accent" />
                    <span class="text-sm font-bold text-slate-700">{child.name}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  @reference "../../app.css";

  .btn-primary {
    @apply h-11 px-6 bg-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20;
  }
</style>
