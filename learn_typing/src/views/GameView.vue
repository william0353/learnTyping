<template>
  <div class="max-w-4xl mx-auto p-4 sm:p-6 font-sans">
    <div class="flex flex-col items-center justify-between md:flex-row gap-4 mb-6">
      <h1 class="text-4xl font-black text-pink-500 flex items-center gap-2 drop-shadow-sm">
        <span>🎮</span> Falling Letters
      </h1>
      <div class="flex gap-4">
        <div class="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
          <span class="text-slate-400 font-bold uppercase tracking-wider text-xs">High Score</span>
          <span class="text-pink-500 font-black text-lg">{{ topScore }}</span>
        </div>
      </div>
    </div>

    <!-- Game Container -->
    <div 
      class="relative w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 h-[500px] select-none outline-none focus-within:border-pink-500/50 transition-colors"
      @click="focusInput"
    >
      <!-- Hidden Input for keyboard focus -->
      <input 
        ref="gameInput"
        type="text"
        class="absolute -top-10 left-0 opacity-0 w-0 h-0"
        @keydown="handleKeyDown"
        autocomplete="off"
        spellcheck="false"
      />

      <!-- Starfield / Neon grid background -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none opacity-80"></div>
      <div class="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>

      <!-- Live Stats (Playing Mode) -->
      <div v-if="gameState === 'playing'" class="absolute top-4 left-4 right-4 flex justify-between items-center z-10 text-white font-mono pointer-events-none">
        <div class="flex gap-6 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800">
          <div>
            <span class="text-slate-400 text-xs block">TIME</span>
            <span class="text-amber-400 font-black text-xl">{{ timeLeft }}s</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs block">SCORE</span>
            <span class="text-pink-400 font-black text-xl">{{ score }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs block">ACCURACY</span>
            <span class="text-green-400 font-black text-xl">{{ accuracy }}%</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs block">SPEED</span>
            <span class="text-blue-400 font-black text-lg">{{ activeSpeed.toFixed(2) }} <span class="text-xs">pts/s</span></span>
          </div>
        </div>

        <!-- Health/Lives Bar -->
        <div class="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-3">
          <span class="text-slate-400 text-xs uppercase font-bold">LIVES</span>
          <div class="flex gap-1">
            <span 
              v-for="i in Math.max(5, lives)" 
              :key="i"
              class="text-lg transition-transform duration-300"
              :class="i <= lives ? 'scale-100' : 'scale-50 opacity-20 filter grayscale'"
            >
              ❤️
            </span>
          </div>
        </div>
      </div>

      <!-- Canvas Area: Falling Letters -->
      <div v-if="gameState === 'playing'" class="absolute inset-0 pointer-events-none">
        <div 
          v-for="letter in fallingLetters" 
          :key="letter.id"
          class="absolute font-black flex items-center justify-center rounded-xl shadow-lg border transition-all duration-75 select-none"
          :style="{
            left: letter.x + '%',
            top: letter.y + 'px',
            fontSize: letter.size + 'px',
            color: letter.color,
            borderColor: letter.color + '44',
            backgroundColor: letter.color + '11',
            transform: 'translateX(-50%)',
            padding: '4px 10px',
            textShadow: '0 0 10px ' + letter.color
          }"
        >
          {{ letter.char }}
        </div>

        <!-- Miss/Hit Flash Overlay -->
        <div 
          class="absolute inset-0 bg-red-500/20 pointer-events-none transition-opacity duration-150"
          :class="flashRed ? 'opacity-100' : 'opacity-0'"
        ></div>
      </div>

      <!-- Start Screen / Idle -->
      <div v-if="gameState === 'idle'" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
        <div class="w-20 h-20 bg-pink-500/10 text-pink-500 rounded-3xl flex items-center justify-center text-4xl mb-6 animate-bounce shadow-inner">
          ☄️
        </div>
        <h2 class="text-3xl font-black text-white mb-3 tracking-tight">Ready to Dodge?</h2>
        <p class="text-slate-400 max-w-md mb-8 text-sm sm:text-base">
          Letters will drop from the top. Type them before they hit the ground. Missing costs a life. Accuracy counts!
        </p>
        <button 
          @click="startGame"
          class="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black rounded-2xl shadow-lg hover:shadow-pink-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer text-lg"
        >
          Start Typing Game
        </button>
      </div>

      <!-- Game Over Screen -->
      <div v-if="gameState === 'gameover'" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/90 backdrop-blur-sm">
        <div class="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center text-3xl mb-4">
          💥
        </div>
        <h2 class="text-3xl font-black text-white mb-2">
          {{ endReason === 'time_out' ? 'Time\'s Up!' : 'Game Over!' }}
        </h2>
        <p class="text-slate-400 mb-6 text-sm">
          {{ endReason === 'time_out' ? 'You survived for 60 seconds!' : 'Your lives have run out.' }}
        </p>

        <!-- Final Stats Grid -->
        <div class="grid grid-cols-3 gap-4 max-w-sm w-full mb-8 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div class="text-center border-r border-slate-800">
            <span class="text-slate-500 text-xs block uppercase">Score</span>
            <span class="text-white font-black text-xl">{{ score }}</span>
          </div>
          <div class="text-center border-r border-slate-800">
            <span class="text-slate-500 text-xs block uppercase">Accuracy</span>
            <span class="text-white font-black text-xl">{{ accuracy }}%</span>
          </div>
          <div class="text-center">
            <span class="text-slate-500 text-xs block uppercase">Speed</span>
            <span class="text-white font-black text-xl">{{ activeSpeed.toFixed(1) }} <span class="text-xs">p/s</span></span>
          </div>
        </div>

        <div class="flex gap-4">
          <button 
            @click="startGame"
            class="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer text-sm"
          >
            Play Again
          </button>
          <button 
            @click="gameState = 'idle'"
            class="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer text-sm"
          >
            Main Menu
          </button>
        </div>
      </div>

      <!-- Focus Indicator Overlay -->
      <div 
        v-if="gameState === 'playing' && !isFocused" 
        class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 cursor-pointer"
        @click="focusInput"
      >
        <span class="text-3xl mb-3 animate-pulse">⏸️</span>
        <span class="text-white font-bold text-lg">Game Paused</span>
        <span class="text-slate-400 text-xs mt-1">Click here to resume playing</span>
      </div>
    </div>

    <!-- Leaderboard / History Section -->
    <div class="mt-8 space-y-6">
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 class="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
          🏆 Top High Scores
        </h3>
        
        <div v-if="topRecords.length === 0" class="text-slate-400 text-center py-6 text-sm">
          No records yet. Start playing to register your first high score!
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            v-for="(rec, index) in topRecords" 
            :key="index"
            class="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between relative overflow-hidden"
          >
            <div class="flex items-center gap-3">
              <span 
                class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                :class="[
                  index === 0 ? 'bg-amber-100 text-amber-700' : '',
                  index === 1 ? 'bg-slate-200 text-slate-700' : '',
                  index === 2 ? 'bg-orange-100 text-orange-700' : ''
                ]"
              >
                {{ index + 1 }}
              </span>
              <div>
                <div class="text-xs text-slate-400 font-medium">{{ formatDate(rec.timestamp) }}</div>
                <div class="font-bold text-slate-700 text-sm">Speed: {{ rec.activeSpeed ? rec.activeSpeed.toFixed(2) : 0 }} pts/s</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-pink-500 font-black text-xl">{{ rec.score }}</div>
              <div class="text-xs text-slate-400">Acc: {{ rec.accuracy }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Table (Collapsible) -->
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <button 
          @click="showAllHistory = !showAllHistory" 
          class="w-full flex items-center justify-between font-black text-slate-800 text-lg cursor-pointer"
        >
          <span class="flex items-center gap-2">📜 All Game History</span>
          <span class="text-slate-400 text-sm">{{ showAllHistory ? '▲ Hide' : '▼ Expand' }}</span>
        </button>

        <div v-if="showAllHistory" class="mt-4 transition-all duration-300">
          <div v-if="allRecords.length === 0" class="text-slate-400 text-center py-6 text-sm">
            No games recorded.
          </div>
          <div v-else class="space-y-4">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm text-slate-600 border-collapse">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 font-bold">
                    <th class="pb-3 pl-2">Date</th>
                    <th class="pb-3">Score</th>
                    <th class="pb-3">Hits</th>
                    <th class="pb-3">Accuracy</th>
                    <th class="pb-3 pr-2">Active Speed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(rec, index) in paginatedRecords" 
                    :key="index"
                    class="border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
                  >
                    <td class="py-3 pl-2">{{ formatDate(rec.timestamp) }}</td>
                    <td class="py-3 font-bold text-pink-500">{{ rec.score }}</td>
                    <td class="py-3">{{ rec.hits }}</td>
                    <td class="py-3">{{ rec.accuracy }}%</td>
                    <td class="py-3 pr-2 font-mono text-blue-500">{{ rec.activeSpeed ? rec.activeSpeed.toFixed(2) : 0 }} pts/s</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Controls -->
            <div v-if="totalPages > 1" class="flex justify-between items-center pt-4 border-t border-slate-100">
              <button 
                @click="currentPage > 1 ? currentPage-- : null"
                :disabled="currentPage === 1"
                class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <span class="text-xs text-slate-500">Page {{ currentPage }} of {{ totalPages }}</span>
              <button 
                @click="currentPage < totalPages ? currentPage++ : null"
                :disabled="currentPage === totalPages"
                class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { saveGameRecord, getGameRecords } from '@/db/index'

// Game Configuration
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const BASE_FALL_SPEED = 1.0 // base speed multiplier
const MIN_SIZE = 30
const MAX_SIZE = 66
const PALETTE = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9']

// Game States
const gameState = ref('idle') // idle, playing, gameover
const gameInput = ref(null)
const isFocused = ref(false)

const fallingLetters = ref([])
const score = ref(0)
const hits = ref(0)
const totalKeyPresses = ref(0)
const lives = ref(5)
const flashRed = ref(false)
const timeLeft = ref(60)
const endReason = ref('')

// Time tracking
let startTime = null
let lastHitTime = null
const activeSpeed = ref(0)

// Game Loops and Intervals
let animationFrameId = null
let spawnTimer = null
let gameTimer = null

// DB Records States
const allRecords = ref([])
const showAllHistory = ref(false)
const currentPage = ref(1)
const pageSize = 8

// Computed accuracy
const accuracy = computed(() => {
  if (totalKeyPresses.value === 0) return 0
  return Math.min(100, Math.round((hits.value / totalKeyPresses.value) * 100))
})

// Leaderboard Top Scores
const topRecords = computed(() => {
  const sorted = [...allRecords.value].sort((a, b) => b.score - a.score)
  return sorted.slice(0, 3)
})

const topScore = computed(() => {
  if (topRecords.value.length === 0) return 0
  return topRecords.value[0].score
})

// Paginated all history records
const paginatedRecords = computed(() => {
  const sorted = [...allRecords.value].sort((a, b) => b.timestamp - a.timestamp)
  const start = (currentPage.value - 1) * pageSize
  return sorted.slice(start, start + pageSize)
})

const totalPages = computed(() => {
  return Math.ceil(allRecords.value.length / pageSize)
})

const focusInput = () => {
  nextTick(() => {
    gameInput.value?.focus()
    if (gameState.value === 'playing') {
      isFocused.value = true
    }
  })
}

// Spawn single letter
const spawnLetter = () => {
  if (gameState.value !== 'playing' || !isFocused.value) return

  const baseSpeed = (Math.random() * 1.5 + 0.8) * BASE_FALL_SPEED
  
  const char = LETTERS[Math.floor(Math.random() * LETTERS.length)]
  const size = Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE + 1)) + MIN_SIZE
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]

  fallingLetters.value.push({
    id: Date.now() + Math.random(),
    char,
    x: Math.random() * 90 + 5, // Keep within 5% - 95% width
    y: 0,
    speed: baseSpeed,
    size,
    color
  })

  // Dynamic spawn rate decreases smoothly using an exponential decay curve
  // Approaches 400ms asymptotically. 0 hits = 1200ms, 40 hits ≈ 556ms, 80 hits ≈ 430ms.
  const currentInterval = Math.max(400, 400 + 800 * Math.pow(0.96, hits.value))
  clearTimeout(spawnTimer)
  spawnTimer = setTimeout(spawnLetter, currentInterval)
}

// Handle keys
const handleKeyDown = (e) => {
  if (gameState.value !== 'playing' || !isFocused.value) return

  // Only count printable single character keypresses
  if (e.key.length !== 1) return

  totalKeyPresses.value++

  const typedChar = e.key.toUpperCase()
  // Find all matching letters on screen
  const matches = fallingLetters.value.filter(l => l.char === typedChar)

  if (matches.length > 0) {
    // Pick the one closest to the bottom (max y)
    let bestMatch = matches[0]
    for (let i = 1; i < matches.length; i++) {
      if (matches[i].y > bestMatch.y) {
        bestMatch = matches[i]
      }
    }

    // Hit success!
    hits.value++
    lastHitTime = Date.now()

    // Add a life every 10 hits
    if (hits.value % 10 === 0) {
      lives.value++
    }

    // Calculate score: Hits * Accuracy * 10
    const currentAcc = hits.value / totalKeyPresses.value
    score.value = Math.round(hits.value * currentAcc * 10)

    // Calculate active speed
    const elapsedSeconds = (lastHitTime - startTime) / 1000
    activeSpeed.value = elapsedSeconds > 0 ? (score.value / elapsedSeconds) : 0

    // Remove letter
    fallingLetters.value = fallingLetters.value.filter(l => l.id !== bestMatch.id)
  }
}

// Game loop
const updatePositions = () => {
  if (gameState.value === 'playing' && isFocused.value) {
    const containerHeight = 500
    const letterHeight = 40

    // Global speed multiplier applies to ALL letters instantly
    const globalSpeedMultiplier = 1 + Math.floor(hits.value / 3) * 0.06

    fallingLetters.value.forEach(letter => {
      letter.y += letter.speed * globalSpeedMultiplier
    })

    // Check if any letter reached the bottom
    const missed = fallingLetters.value.filter(letter => letter.y >= (containerHeight - letterHeight))
    if (missed.length > 0) {
      lives.value -= missed.length
      triggerFlashRed()
      
      // Remove missed
      fallingLetters.value = fallingLetters.value.filter(letter => letter.y < (containerHeight - letterHeight))

      // Game over check
      if (lives.value <= 0) {
        endReason.value = 'lives_out'
        endGame()
      }
    }
  }

  if (gameState.value === 'playing') {
    animationFrameId = requestAnimationFrame(updatePositions)
  }
}

const triggerFlashRed = () => {
  flashRed.value = true
  setTimeout(() => {
    flashRed.value = false
  }, 150)
}

const startGame = () => {
  gameState.value = 'playing'
  score.value = 0
  hits.value = 0
  totalKeyPresses.value = 0
  lives.value = 5
  activeSpeed.value = 0
  fallingLetters.value = []
  timeLeft.value = 60
  endReason.value = ''
  
  startTime = Date.now()
  lastHitTime = Date.now()

  focusInput()

  clearTimeout(spawnTimer)
  spawnTimer = setTimeout(spawnLetter, 1200)

  clearInterval(gameTimer)
  gameTimer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endReason.value = 'time_out'
      endGame()
    }
  }, 1000)

  cancelAnimationFrame(animationFrameId)
  animationFrameId = requestAnimationFrame(updatePositions)
}

const endGame = async () => {
  gameState.value = 'gameover'
  clearTimeout(spawnTimer)
  clearInterval(gameTimer)
  cancelAnimationFrame(animationFrameId)

  // Save record to DB
  const record = {
    score: score.value,
    hits: hits.value,
    accuracy: accuracy.value,
    activeSpeed: activeSpeed.value,
    timestamp: Date.now()
  }

  try {
    await saveGameRecord(record)
    await loadHistory()
  } catch (err) {
    console.error('Failed to save game record:', err)
  }
}

const loadHistory = async () => {
  try {
    allRecords.value = await getGameRecords()
  } catch (err) {
    console.error('Failed to load game history:', err)
  }
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Handle window blur/focus events
const handleWindowBlur = () => {
  isFocused.value = false
}

onMounted(async () => {
  await loadHistory()
  window.addEventListener('blur', handleWindowBlur)
})

onUnmounted(() => {
  clearTimeout(spawnTimer)
  clearInterval(gameTimer)
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('blur', handleWindowBlur)
})
</script>

<style scoped>
.bg-grid-white\/\[0\.02\] {
  background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}
.scale-102:hover {
  transform: scale(1.02);
}
</style>
