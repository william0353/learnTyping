<template>
  <div class="max-w-4xl mx-auto h-full p-4 md:p-6 font-sans w-full">
    
    <!-- Editor: Lined Paper Sheet -->
    <div class="bg-[#fdfcf8] rounded-3xl shadow-md p-6 md:p-8 border border-slate-200/60 flex flex-col h-[600px] md:h-[700px] w-full relative overflow-hidden min-w-0">
        
        <!-- Editor Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-orange-100/50 pb-4 mb-4 font-sans select-none gap-4">
          
          <!-- Dropdown Navigation and Actions -->
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <!-- Dropdown -->
            <div class="flex items-center w-full sm:w-auto">
              <select 
                v-model="activeDiaryId"
                @change="handleDropdownChange"
                class="w-full sm:w-[260px] bg-slate-50/80 hover:bg-slate-100 border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2 text-slate-700 font-bold text-sm cursor-pointer truncate transition-all shadow-sm outline-none"
              >
                <option v-if="dropdownOptions.length === 0" value="" disabled>No diaries yet</option>
                <option v-for="diary in dropdownOptions" :key="diary.id" :value="diary.id">
                  {{ formatShortDate(diary.date) }} - {{ getDiaryTitle(diary.content) }}
                </option>
              </select>
            </div>
            
            <!-- New Diary Button -->
            <button 
              @click="createNewDiary" 
              class="flex items-center justify-center p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold transition-all cursor-pointer shadow-sm flex-shrink-0"
              title="Write New Diary"
            >
              ➕
            </button>

            <!-- Delete Diary Button -->
            <button 
              v-if="activeDiary"
              @click="confirmDeleteDiary(activeDiary)" 
              class="flex items-center justify-center p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-all cursor-pointer shadow-sm flex-shrink-0"
              title="Delete Diary"
            >
              🗑️
            </button>
          </div>
          
          <!-- Word Count & Sound Settings -->
          <div class="flex items-center gap-4 flex-shrink-0">
            <SoundSettings />
            <div class="text-slate-400 text-xs font-semibold whitespace-nowrap flex-shrink-0">
              {{ editorContent.length }} characters | {{ wordCount }} words
            </div>
          </div>
        </div>

        <!-- Writing Area -->
        <textarea
          ref="editorTextarea"
          v-model="editorContent"
          @input="handleContentInput"
          @keydown="handleKeydown"
          placeholder="Today's diary...
The first line will automatically become the title of your entry."
          class="flex-1 w-full resize-none outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent bg-transparent text-slate-700 leading-loose text-base md:text-lg font-medium tracking-wide placeholder-slate-300 scroll-smooth shadow-none p-0"
          spellcheck="false"
          :disabled="!activeDiary"
        ></textarea>

        <!-- Footer / Backup Notice -->
        <div class="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p class="text-center sm:text-left leading-relaxed">
            Diary data is saved locally on your device and never uploaded to the internet. 
            However, it may be lost if you clear your browser cache. We recommend backing up your data regularly.
          </p>
          <button 
            @click="backupDiaries" 
            class="whitespace-nowrap px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
          >
            ⬇️ Backup (ZIP)
          </button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import JSZip from 'jszip'
import { getDiaries, saveDiary, deleteDiary } from '@/db/index'
import SoundSettings from '@/components/SoundSettings.vue'
import { useSettingsStore } from '@/stores/settings'

const globalSettings = useSettingsStore()
const diariesList = ref([])
const activeDiary = ref(null)
const activeDiaryId = ref('')
const editorContent = ref('')
const editorTextarea = ref(null)

let debounceTimer = null

// Get Today's date string in YYYY-MM-DD
const getTodayString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format date for Header (e.g. Wednesday, June 6, 2026)
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// Format date for Sidebar (e.g. Jun 6)
const formatShortDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Get the title from the first line
const getDiaryTitle = (content) => {
  const trimmed = content.trim()
  if (!trimmed) return 'New Diary'
  const firstLine = trimmed.split('\n')[0]
  return firstLine.substring(0, 18) + (firstLine.length > 18 ? '...' : '')
}

// Get the preview from secondary content
const getDiaryPreview = (content) => {
  const trimmed = content.trim()
  if (!trimmed) return 'No additional text'
  const lines = trimmed.split('\n')
  const bodyText = lines.slice(1).join(' ').trim()
  if (!bodyText) return 'No additional text'
  return bodyText.substring(0, 30) + (bodyText.length > 30 ? '...' : '')
}

// Combined list for the dropdown
const dropdownOptions = computed(() => {
  const options = [...diariesList.value]
  // Push the current temporary diary to the options if it's new
  if (activeDiary.value && activeDiary.value.isNew) {
    // Only unshift if not already in the list
    if (!options.some(d => d.id === activeDiary.value.id)) {
      options.unshift(activeDiary.value)
    }
  }
  return options
})

// Word Count
const wordCount = computed(() => {
  const text = editorContent.value.trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
})

// Refresh left sidebar list
const refreshDiariesList = async () => {
  try {
    diariesList.value = await getDiaries()
  } catch (err) {
    console.error('Failed to load diaries list:', err)
  }
}

// Save the active diary
const saveCurrentDiary = async () => {
  if (!activeDiary.value) return
  
  const content = editorContent.value
  
  // If the note is new and completely empty, we don't create it in IndexedDB
  if (activeDiary.value.isNew && !content.trim()) {
    return
  }

  
  
  const diaryToSave = {
    ...activeDiary.value,
    content: content,
    updatedAt: Date.now()
  }

  // Remove temporary tag on first persist
  if (diaryToSave.isNew) {
    delete diaryToSave.isNew
    activeDiary.value = diaryToSave
  }

  try {
    await saveDiary(diaryToSave)
    await refreshDiariesList()
  } catch (err) {
    console.error('Error saving diary:', err)
  }
}

// Debounced Content input handler
const handleContentInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  
  debounceTimer = setTimeout(async () => {
    await saveCurrentDiary()
  }, 1500)
}

// Force flush save
const flushSave = async () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
    await saveCurrentDiary()
  }
}

const handleKeydown = (e) => {
  if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
    globalSettings.playSound()
  }
}

// Switch active diary via dropdown
const handleDropdownChange = async () => {
  const selected = dropdownOptions.value.find(d => d.id === activeDiaryId.value)
  if (selected) {
    await selectDiary(selected)
  }
}

// Switch active diary
const selectDiary = async (diary) => {
  if (activeDiary.value && activeDiary.value.id === diary.id) return
  
  // Save active diary changes first
  await flushSave()
  
  activeDiary.value = diary
  activeDiaryId.value = diary.id
  editorContent.value = diary.content
  
  focusTextarea()
}

// Create new blank diary
const createNewDiary = async () => {
  await flushSave()
  
  const newDiary = {
    id: 'diary-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    date: getTodayString(),
    content: '',
    isNew: true,
    updatedAt: Date.now()
  }
  
  activeDiary.value = newDiary
  activeDiaryId.value = newDiary.id
  editorContent.value = ''
  
  focusTextarea()
}

// Delete diary
const confirmDeleteDiary = async (diary) => {
  if (confirm(`Are you sure you want to delete the diary entry for ${formatShortDate(diary.date)}?`)) {
    try {
      await deleteDiary(diary.id)
      
      // If the deleted diary was active, reset to today's diary
        if (activeDiary.value && activeDiary.value.id === diary.id) {
        activeDiary.value = null
        activeDiaryId.value = ''
        editorContent.value = ''
        await loadInitialDiary()
      } else {
        await refreshDiariesList()
        activeDiaryId.value = activeDiary.value ? activeDiary.value.id : ''
      }
    } catch (err) {
      console.error('Failed to delete diary:', err)
      alert('Failed to delete diary.')
    }
  }
}

// Backup all diaries to ZIP
const backupDiaries = async () => {
  try {
    await flushSave()
    const allDiaries = await getDiaries()
    if (!allDiaries || allDiaries.length === 0) {
      alert("No diaries to backup.")
      return
    }
    
    const zip = new JSZip()
    
    allDiaries.forEach(diary => {
      const datePart = formatShortDate(diary.date)
      const titlePart = getDiaryTitle(diary.content)
      const safeTitle = `${datePart} - ${titlePart}`.replace(/[/\\?%*:|"<>]/g, '-')
      zip.file(`${safeTitle}.txt`, diary.content || '')
    })
    
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = `diaries_backup_${getTodayString()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error("Backup failed:", err)
    alert("Failed to create backup.")
  }
}

const focusTextarea = () => {
  nextTick(() => {
    editorTextarea.value?.focus()
  })
}

// Initial page load diary fetching logic
const loadInitialDiary = async () => {
  await refreshDiariesList()
  
  const todayStr = getTodayString()
  
  // Look for today's entry
  const todayDiary = diariesList.value.find(d => d.date === todayStr)
  
  if (todayDiary) {
    activeDiary.value = todayDiary
    activeDiaryId.value = todayDiary.id
    editorContent.value = todayDiary.content
  } else {
    // If not found, create a temporary entry in memory
    const tempId = 'temp-' + Date.now()
    activeDiary.value = {
      id: tempId,
      date: todayStr,
      content: '',
      isNew: true,
      updatedAt: Date.now()
    }
    activeDiaryId.value = tempId
    editorContent.value = ''
  }
  
  focusTextarea()
}

onMounted(async () => {
  await loadInitialDiary()
})

onUnmounted(async () => {
  await flushSave()
})
</script>

<style scoped>
/* Apple Notes lined style for texture */
textarea {
  background-attachment: local;
  background-image: linear-gradient(transparent, transparent 33px, #f1f0ea 33px, #f1f0ea 34px, transparent 34px);
  background-size: 100% 34px;
}
</style>
