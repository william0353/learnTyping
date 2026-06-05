<template>
  <div class="flex flex-col items-center max-w-7xl mx-auto h-full p-4 font-mono w-full">
    
    <!-- Control Panel -->
    <div class="bg-white rounded-2xl shadow-sm p-4 w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border border-slate-100 font-sans">
      
      <!-- Material Selector -->
      <button 
        @click="openModal" 
        class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold transition-colors cursor-pointer w-full md:w-auto justify-center"
      >
        <span class="text-xl">📚</span>
        <span class="truncate max-w-[200px]">{{ currentMaterialName }}</span>
        <span class="text-blue-400 ml-1 text-xs">▼</span>
      </button>

      <!-- Settings Toggles -->
      <div class="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6">
        <label class="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-blue-500 font-bold text-sm">
          <input type="checkbox" v-model="settings.skipSpaces" class="w-4 h-4 accent-blue-500 rounded" />
          Skip Spaces
        </label>
        <label class="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-blue-500 font-bold text-sm">
          <input type="checkbox" v-model="settings.skipPunctuation" class="w-4 h-4 accent-blue-500 rounded" />
          Skip Punctuation
        </label>
        <label class="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-blue-500 font-bold text-sm">
          <input type="checkbox" v-model="settings.ignoreCase" class="w-4 h-4 accent-blue-500 rounded" />
          Ignore Case
        </label>
      </div>
    </div>

    <!-- Typing Area -->
    <div 
      class="w-full bg-white rounded-3xl shadow-lg p-6 md:p-8 mb-6 relative border-4 border-transparent outline-none focus-within:border-blue-300 transition-colors cursor-text overflow-hidden"
      @click="focusArea"
    >
      <input 
        ref="hiddenInput"
        type="text"
        v-model="inputValue"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="opacity-0 absolute top-0 left-0 w-[1px] h-[1px] -z-10"
        autocomplete="off"
        spellcheck="false"
      />
      <!-- Loading indicator -->
      <div v-if="isLoading" class="absolute inset-0 bg-white/95 rounded-3xl flex items-center justify-center z-10 font-sans text-lg text-slate-500">
        <div class="animate-spin mr-3">🌀</div> Loading lesson...
      </div>
      


      <!-- Text Lines (Continuous Flow Layout) -->
      <div 
        v-if="!isLoading" 
        class="text-lg sm:text-xl md:text-2xl lg:text-3xl select-none overflow-y-auto h-[18rem] md:h-[22rem] relative scroll-smooth p-2"
        ref="scrollContainer"
      >
        <div class="flex flex-wrap justify-start gap-x-[1px] sm:gap-x-1 gap-y-4 md:gap-y-6 pb-[12rem] pt-4">
          <template v-for="(char, idx) in targetChars" :key="idx">
            
            <!-- Explicit Line Break for \n -->
            <div v-if="char === '\n' || char === '\r'" class="w-full h-0"></div>

            <!-- Normal Character Cell -->
            <div 
              v-else
              :id="'char-' + idx"
              class="flex flex-col items-center justify-between relative min-w-[1.2ch] w-auto px-[1px] flex-shrink-0"
            >
              <!-- Top Row: Source Character -->
              <span :class="getSourceCharClass(idx)">
                {{ getSourceCharDisplay(char, idx) }}
              </span>

              <!-- Bottom Row: User Input Character -->
              <span :class="getUserCharClass(idx)" class="h-[1.2em] flex items-center justify-center">
                {{ getUserTypedChar(idx) }}
              </span>

              <!-- Cursor Underline / Highlight -->
              <span 
                v-if="idx === currentIndex && isFocused" 
                class="absolute left-0 bottom-[-4px] w-full h-[4px] bg-blue-500 animate-pulse rounded-full"
              ></span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Stats Footer -->
    <div class="grid grid-cols-3 gap-4 md:gap-6 w-full font-sans">
      <div class="bg-white rounded-2xl shadow-sm p-4 md:p-6 flex flex-col items-center justify-center border-b-4 border-blue-400">
        <span class="text-slate-400 font-bold uppercase tracking-wider text-xs md:text-sm mb-1">Speed</span>
        <div class="text-xl sm:text-2xl md:text-4xl font-black text-slate-700">
          <span class="text-blue-500">{{ stats.wpm }}</span> <span class="text-xs md:text-lg">WPM</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-4 md:p-6 flex flex-col items-center justify-center border-b-4 border-pink-400">
        <span class="text-slate-400 font-bold uppercase tracking-wider text-xs md:text-sm mb-1">Errors</span>
        <div class="text-xl sm:text-2xl md:text-4xl font-black text-slate-700">
          <span class="text-pink-500">{{ stats.errors }}</span>
        </div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-4 md:p-6 flex flex-col items-center justify-center border-b-4 border-green-400">
        <span class="text-slate-400 font-bold uppercase tracking-wider text-xs md:text-sm mb-1">Accuracy</span>
        <div class="text-xl sm:text-2xl md:text-4xl font-black text-slate-700">
          <span class="text-green-500">{{ accuracy }}%</span>
        </div>
      </div>
    </div>

    <!-- Material Picker Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans border-4 border-blue-100 flex flex-col max-h-[85vh]">
        <!-- Modal Header -->
        <div class="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
          <h3 class="text-2xl font-black text-blue-600">
            Select Typing Lesson
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 text-3xl font-bold cursor-pointer">&times;</button>
        </div>
        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-6 flex-grow">
          <div v-for="lang in indexData.languages" :key="lang.id" class="space-y-3">
            <h4 class="text-lg font-black text-slate-700 border-b border-slate-100 pb-1">
              {{ lang.name }}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                v-for="mat in lang.materials"
                :key="mat.id"
                @click="selectMaterial(mat)"
                :disabled="mat.pro"
                class="text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center"
                :class="[
                  userStore.currentMaterialId === mat.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50/30',
                  mat.pro ? 'opacity-65 cursor-not-allowed bg-slate-100/40 border-slate-200' : 'hover:shadow-md hover:border-blue-300 cursor-pointer'
                ]"
              >
                <div>
                  <div class="font-bold text-slate-700 flex items-center gap-2">
                    {{ mat.name }}
                    <span v-if="mat.pro" class="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide uppercase">PRO</span>
                  </div>
                </div>
                <span v-if="userStore.currentMaterialId === mat.id" class="text-blue-500 font-bold">✓</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTypingStore } from '@/stores/typing'
import { useUserStore } from '@/stores/user'

const typingStore = useTypingStore()
const userStore = useUserStore()
const typingArea = ref(null)
const hiddenInput = ref(null)
const scrollContainer = ref(null)
const inputValue = ref('')

const isFocused = ref(false)
const isLoading = ref(true)
const isModalOpen = ref(false)
const windowWidth = ref(window.innerWidth)

const settings = ref({
  skipSpaces: false,
  skipPunctuation: false,
  ignoreCase: true
})

// Dynamic Material state
const indexData = ref({ languages: [] })
const sampleText = ref("")

const currentMaterialName = computed(() => {
  if (!indexData.value.languages) return ""
  for (const lang of indexData.value.languages) {
    const found = lang.materials.find(m => m.id === userStore.currentMaterialId)
    if (found) return found.name
  }
  return "Lesson 1"
})

const targetChars = computed(() => sampleText.value.split(''))
const typedRecord = ref([]) // array of { char: string, correct: boolean, targetIdx: number, skipped?: boolean }
const currentIndex = ref(0) // index in targetChars

watch(currentIndex, () => {
  nextTick(() => {
    const activeEl = document.getElementById('char-' + currentIndex.value)
    if (activeEl && scrollContainer.value) {
      const containerTop = scrollContainer.value.getBoundingClientRect().top
      const elTop = activeEl.getBoundingClientRect().top
      const relativeTop = elTop - containerTop + scrollContainer.value.scrollTop
      scrollContainer.value.scrollTo({
        top: relativeTop - scrollContainer.value.clientHeight / 2 + activeEl.clientHeight / 2,
        behavior: 'smooth'
      })
    }
  })
})

const stats = ref({
  startTime: null,
  errors: 0,
  totalTyped: 0,
  wpm: 0,
  activeWpm: 0
})

const accuracy = computed(() => {
  if (stats.value.totalTyped === 0) return 100
  return Math.max(0, Math.round(((stats.value.totalTyped - stats.value.errors) / stats.value.totalTyped) * 100))
})

let timer = null
let lastTypeTime = null

const focusArea = () => {
  hiddenInput.value?.focus()
}

const openModal = () => {
  isModalOpen.value = true
  isFocused.value = false
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// Fetch the index and material
const loadLesson = async () => {
  isLoading.value = true
  try {
    // 1. Fetch materials index
    const indexRes = await fetch(`${import.meta.env.BASE_URL}data/index.json`)
    indexData.value = await indexRes.json()

    // 2. Determine target material path
    let targetPath = 'en/lesson1.txt'
    let currentId = userStore.currentMaterialId

    // Try finding the path corresponding to currentMaterialId
    let found = false
    for (const lang of indexData.value.languages) {
      const match = lang.materials.find(m => m.id === currentId)
      if (match) {
        targetPath = match.path
        found = true
        break
      }
    }

    // Fallback if not found
    if (!found) {
      userStore.currentMaterialId = 'en_lesson1'
      targetPath = 'en/lesson1.txt'
    }

    // 3. Fetch file content
    const txtRes = await fetch(`${import.meta.env.BASE_URL}data/${targetPath}`)
    const text = await txtRes.text()
    
    // Normalize carriage returns, but preserve standard newlines
    sampleText.value = text.replace(/\r\n/g, '\n').trim()
    
    // 4. Initialize indices
    currentIndex.value = userStore.currentProgressIndex
    typedRecord.value = []
    
    // Repopulate typedRecord up to the current progress index with correct items 
    // to render historical progress correctly in the template
    for (let i = 0; i < currentIndex.value; i++) {
      typedRecord.value.push({ char: sampleText.value[i], correct: true, targetIdx: i })
    }

    // Reset current run metrics
    stats.value = {
      startTime: null,
      errors: 0,
      totalTyped: 0,
      wpm: 0,
      activeWpm: 0
    }
    
    advanceIfSkippable()
  } catch (error) {
    console.error('Failed to load typing material:', error)
    sampleText.value = "The quick brown fox jumps over the lazy dog."
    currentIndex.value = 0
    typedRecord.value = []
  } finally {
    isLoading.value = false
    nextTick(() => {
      focusArea()
    })
  }
}

const selectMaterial = async (material) => {
  if (material.pro) return
  closeModal()
  await userStore.updateProgress(material.id, 0)
  await loadLesson()
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await userStore.loadUser()
  await loadLesson()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (timer) clearInterval(timer)
})

const isPunctuation = (char) => /[.,\/#!$%\^&\*;:{}=\-_`~()]/.test(char)

const advanceIfSkippable = () => {
  while (currentIndex.value < targetChars.value.length) {
    const char = targetChars.value[currentIndex.value]
    if (char === '\n' || char === '\r') {
      typedRecord.value.push({ char: '\n', correct: true, targetIdx: currentIndex.value, skipped: true })
      currentIndex.value++
    } else if (settings.value.skipSpaces && char === ' ') {
      typedRecord.value.push({ char: ' ', correct: true, targetIdx: currentIndex.value, skipped: true })
      currentIndex.value++
    } else if (settings.value.skipPunctuation && isPunctuation(char)) {
      typedRecord.value.push({ char: char, correct: true, targetIdx: currentIndex.value, skipped: true })
      currentIndex.value++
    } else {
      break
    }
  }
  userStore.updateProgress(userStore.currentMaterialId, currentIndex.value)
}

const startSession = () => {
  const now = Date.now()
  if (!stats.value.startTime) {
    stats.value.startTime = now
    lastTypeTime = now
    typingStore.startSession(userStore.currentMaterialId)
    timer = setInterval(updateStats, 1000)
  } else {
    const idleMs = now - lastTypeTime
    if (idleMs > 10000) {
      stats.value.startTime += idleMs
    }
    lastTypeTime = now
  }
}

const finishSession = () => {
  clearInterval(timer)
  typingStore.endSession()
  alert("🎉 Great job! You finished the practice!")
}

const handleKeydown = (e) => {
  if (isLoading.value) return

  if (e.key === 'Backspace') {
    e.preventDefault()
    startSession()

    if (currentIndex.value > 0) {
      let lastTypedIdx = typedRecord.value.length - 1
      while (lastTypedIdx >= 0 && typedRecord.value[lastTypedIdx].skipped) {
        lastTypedIdx--
      }
      if (lastTypedIdx >= 0) {
        const removed = typedRecord.value.splice(lastTypedIdx)
        currentIndex.value = removed[0].targetIdx
      }
    }
    if (lastTypeTime) {
      lastTypeTime = Date.now()
    }
    userStore.updateProgress(userStore.currentMaterialId, currentIndex.value)
    return
  }
}

const handleInput = (e) => {
  if (isLoading.value) return
  
  const chars = inputValue.value.split('')
  inputValue.value = '' // clear immediately
  
  for (const inputChar of chars) {
    startSession()
    if (currentIndex.value >= targetChars.value.length) return
    
    const targetChar = targetChars.value[currentIndex.value]
    let isCorrect = false
    if (settings.value.ignoreCase) {
      isCorrect = inputChar.toLowerCase() === targetChar.toLowerCase()
    } else {
      isCorrect = inputChar === targetChar
    }

    typedRecord.value.push({ char: inputChar, correct: isCorrect, targetIdx: currentIndex.value })
    
    stats.value.totalTyped++
    if (!isCorrect) stats.value.errors++

    currentIndex.value++
    advanceIfSkippable()

    if (currentIndex.value >= targetChars.value.length) {
      finishSession()
    }
  }
}

const updateStats = () => {
  if (!stats.value.startTime) return
  const now = Date.now()
  if (lastTypeTime && (now - lastTypeTime > 10000)) return
  const durationMinutes = (now - stats.value.startTime) / 60000
  if (durationMinutes > 0) {
    const currentWpm = Math.round((stats.value.totalTyped / 5) / durationMinutes)
    stats.value.wpm = currentWpm
    stats.value.activeWpm = currentWpm
    
    typingStore.updateActiveSession(
      Math.round(durationMinutes * 60),
      currentWpm,
      currentWpm,
      stats.value.errors
    )
  }
}

const getSourceCharClass = (absoluteIndex) => {
  if (absoluteIndex < currentIndex.value) {
    return 'text-slate-400 font-medium' // already typed through
  }
  if (absoluteIndex === currentIndex.value && isFocused.value) {
    return 'text-blue-600 font-bold scale-110 transition-transform'
  }
  return 'text-slate-300'
}

const getSourceCharDisplay = (char, absoluteIndex) => {
  if (char !== ' ') return char
  return (absoluteIndex === currentIndex.value && isFocused.value) ? '_' : ' '
}

const getUserTypedChar = (absoluteIndex) => {
  const record = typedRecord.value.find(r => r.targetIdx === absoluteIndex)
  if (!record || record.skipped) return ''
  return record.char === ' ' ? ' ' : record.char
}

const getUserCharClass = (absoluteIndex) => {
  const record = typedRecord.value.find(r => r.targetIdx === absoluteIndex)
  if (!record || record.skipped) return ''
  return record.correct ? 'text-green-500 font-bold' : 'text-red-500 font-bold bg-red-50 px-0.5 rounded'
}

watch(settings, () => {
  advanceIfSkippable()
}, { deep: true })
</script>
