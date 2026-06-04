<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh]">
    <h1 class="text-5xl font-bold text-blue-500 mb-8 drop-shadow-sm">Welcome to Learn Typing!</h1>
    <p class="text-xl text-slate-600 mb-12">Choose an activity to start practicing your typing skills.</p>
    
    <div class="flex gap-8">
      <router-link to="/practice" class="group flex flex-col items-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-4 border-transparent hover:border-blue-400">
        <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <span class="text-4xl">⌨️</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-700">Practice</h2>
      </router-link>
      
      <router-link to="/game" class="group flex flex-col items-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-4 border-transparent hover:border-pink-400">
        <div class="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <span class="text-4xl">🎮</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-700">Games</h2>
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>
