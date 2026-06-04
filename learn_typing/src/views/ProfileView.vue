<template>
  <div class="p-8">
    <h1 class="text-4xl font-bold text-green-500 mb-6">My Profile</h1>
    <div class="bg-white p-8 rounded-3xl shadow-md border-2 border-green-100">
      <div v-if="userStore.id !== 'default-user'" class="text-lg text-slate-600">
        <p>Name: {{ userStore.name }}</p>
        <p>Email: {{ userStore.email }}</p>
        <p>Account Type: {{ userStore.isPaid ? 'Premium' : 'Free' }}</p>
      </div>
      <div v-else>
        <p class="text-lg text-slate-600 mb-4">You are playing as a Guest.</p>
        <button class="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 hover:-translate-y-1 transition-all">Sign In</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'

const userStore = useUserStore()

onMounted(() => {
  userStore.loadUser()
})
</script>
