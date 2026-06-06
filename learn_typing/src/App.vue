<template>
  <div class="min-h-screen flex flex-col bg-slate-50 font-sans">
    <header class="bg-white shadow-sm border-b-4 border-blue-400">
      <nav class="max-w-full mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
        <router-link to="/" class="flex items-center gap-2 group">
          <span class="text-3xl">⌨️</span>
          <span class="text-2xl font-black text-blue-500 tracking-wide group-hover:text-blue-600 transition-colors">Lululala</span>
        </router-link>
        <div class="flex gap-4">
          <router-link to="/practice" class="nav-link" active-class="active">Practice</router-link>
          <router-link to="/game" class="nav-link" active-class="active">Game</router-link>
          <router-link to="/profile" class="nav-link" active-class="active">Profile</router-link>
        </div>
      </nav>
    </header>

    <main class="flex-grow w-full p-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
@reference "tailwindcss";

.nav-link {
  @apply px-4 py-2 rounded-full font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-500 transition-colors;
}
.nav-link.active {
  @apply bg-blue-100 text-blue-600;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
