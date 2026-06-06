<template>
  <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
    <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
      <input 
        type="checkbox" 
        :checked="settings.soundEnabled"
        @change="settings.toggleSound()"
        class="w-4 h-4 text-blue-500 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 outline-none"
      >
      <span class="text-slate-600 font-bold text-xs uppercase tracking-wider">Sound</span>
    </label>
    
    <select 
      v-if="settings.soundEnabled"
      :value="settings.soundType"
      @change="(e) => settings.setSoundType(e.target.value)"
      class="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-2 py-1 outline-none"
    >
      <option value="water">Water</option>
      <option value="pop">Pop</option>
    </select>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>
