<template>
  <div class="max-w-2xl mx-auto py-12 px-6 font-sans">
    <div class="bg-white rounded-3xl shadow-lg p-8 md:p-12 border border-slate-100">
      <h1 class="text-3xl font-black text-slate-800 mb-6">About Us</h1>
      
      <!-- Photo -->
      <div class="mb-8 overflow-hidden rounded-2xl shadow-md border border-slate-100">
        <img 
          src="/me.jpg" 
          alt="Me and Siheng" 
          class="w-full h-64 md:h-80 object-cover hover:scale-102 transition-transform duration-500"
        />
      </div>

      <div class="space-y-6 text-slate-600 leading-relaxed">
        <p>
          This is a small typing practice website created via vibe coding by me and my son, Siheng. 
          We built this project together to learn and practice typing skills. </p>
        <p>
          In the future, we might 
          introduce some simple paid features. All profits generated from this website will be 
          donated to the Dutch charity organization <strong> <a href="https://www.stichtingjarigejob.nl/" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 font-bold underline">Stichting Jarige Job</a></strong>.
        </p>

        <p>
          I am a Senior Architect and AI Developer. You can connect with me on 
          <a 
            href="https://www.linkedin.com/in/xing-fu-83b893a4/" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="text-blue-500 hover:text-blue-600 font-bold underline"
          >LinkedIn</a>
        </p>
      </div>

      <div class="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
        <router-link 
          to="/" 
          class="text-sm text-slate-400 hover:text-blue-500 font-bold transition-colors"
        >
          ← Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// About page logic
</script>
