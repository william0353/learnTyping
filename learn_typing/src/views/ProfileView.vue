<template>
  <div class="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto">
    <h1 class="text-3xl md:text-4xl font-bold text-green-500 mb-6">My Profile</h1>
    
    <!-- User Info Section -->
    <div class="bg-white p-6 md:p-8 rounded-3xl shadow-md border-2 border-green-100 mb-8">
      <div v-if="userStore.id !== 'default-user'" class="text-lg text-slate-600">
        <p><span class="font-bold text-slate-700">Name:</span> {{ userStore.name }}</p>
        <p><span class="font-bold text-slate-700">Email:</span> {{ userStore.email }}</p>
        <p><span class="font-bold text-slate-700">Account Type:</span> {{ userStore.isPaid ? 'Premium' : 'Free' }}</p>
      </div>
      <div v-else>
        <p class="text-lg text-slate-600 mb-4">You are playing as a Guest.</p>
        <button class="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 hover:-translate-y-1 transition-all">Sign In</button>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="bg-white p-6 md:p-8 rounded-3xl shadow-md border-2 border-slate-100 mb-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 class="text-2xl font-bold text-slate-700">Typing Speed Progress</h2>
        
        <!-- Time Range Selector -->
        <div class="flex bg-slate-100 p-1 rounded-xl">
          <button 
            v-for="range in timeRanges" 
            :key="range.value"
            @click="selectedTimeRange = range.value"
            class="px-4 py-1.5 text-sm font-bold rounded-lg transition-all"
            :class="selectedTimeRange === range.value ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            {{ range.label }}
          </button>
        </div>
      </div>

      <div v-if="chartData.labels.length > 0" class="h-[300px] w-full">
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="text-slate-500 italic h-[300px] flex items-center justify-center bg-slate-50 rounded-2xl">
        No practice records available yet. Start typing!
      </div>
    </div>

    <!-- Table Section -->
    <div class="bg-white p-6 md:p-8 rounded-3xl shadow-md border-2 border-slate-100 mb-8 overflow-hidden">
      <h2 class="text-2xl font-bold text-slate-700 mb-6">Practice Records</h2>
      
      <div class="overflow-x-auto w-full">
        <table class="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr class="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <th class="p-4 rounded-tl-xl">Date</th>
              <th class="p-4">Material</th>
              <th class="p-4 text-center">WPM</th>
              <th class="p-4 text-center">Errors</th>
              <th class="p-4 text-right rounded-tr-xl">Duration</th>
            </tr>
          </thead>
          <tbody class="text-slate-600 text-sm md:text-base">
            <tr v-for="record in paginatedRecords" :key="record.id" class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <td class="p-4 font-mono text-xs">{{ formatDate(record.timestamp) }}</td>
              <td class="p-4 font-semibold text-slate-700">{{ getMaterialName(record.articleId) }}</td>
              <td class="p-4 text-center font-bold text-blue-500">{{ record.speedWPM }}</td>
              <td class="p-4 text-center font-bold" :class="record.errors > 0 ? 'text-pink-500' : 'text-green-500'">{{ record.errors }}</td>
              <td class="p-4 text-right font-mono">{{ formatDuration(record.durationSeconds) }}</td>
            </tr>
            <tr v-if="paginatedRecords.length === 0">
              <td colspan="5" class="p-8 text-center text-slate-500 italic">No records found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
        <div class="text-sm text-slate-500">
          Showing <span class="font-bold text-slate-700">{{ Math.min((currentPage - 1) * pageSize + 1, sortedRecords.length) }}</span> 
          to <span class="font-bold text-slate-700">{{ Math.min(currentPage * pageSize, sortedRecords.length) }}</span> 
          of <span class="font-bold text-slate-700">{{ sortedRecords.length }}</span> results
        </div>
        <div class="flex gap-2">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-xl font-bold text-sm transition-all"
            :class="currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'"
          >
            Previous
          </button>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-xl font-bold text-sm transition-all"
            :class="currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useTypingStore } from '@/stores/typing'

// Chart.js imports
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const userStore = useUserStore()
const typingStore = useTypingStore()

const indexData = ref({ languages: [] })

// Pagination State
const currentPage = ref(1)
const pageSize = 10

onMounted(async () => {
  userStore.loadUser()
  await typingStore.loadRecords()
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/index.json`)
    indexData.value = await res.json()
  } catch (e) {
    console.error('Failed to load materials index:', e)
  }
})

// Chart State
const selectedTimeRange = ref('1w')
const timeRanges = [
  { label: '1W', value: '1w' },
  { label: '4W', value: '4w' },
  { label: '3M', value: '3M' },
  { label: 'All', value: 'all' }
]

// --- Chart Data ---
const chartData = computed(() => {
  const records = typingStore.records
  if (!records || records.length === 0) {
    return { labels: [], datasets: [] }
  }

  const now = Date.now()
  let startTime = now

  if (selectedTimeRange.value === '1w') {
    startTime = now - 7 * 24 * 60 * 60 * 1000
  } else if (selectedTimeRange.value === '4w') {
    startTime = now - 28 * 24 * 60 * 60 * 1000
  } else if (selectedTimeRange.value === '3M') {
    startTime = now - 90 * 24 * 60 * 60 * 1000
  } else {
    // All time
    const minTimestamp = Math.min(...records.map(r => r.timestamp))
    startTime = minTimestamp
  }

  // Ensure startTime is strictly before now
  if (startTime >= now) {
    startTime = now - 24 * 60 * 60 * 1000 // default to 1 day if data is somehow exactly now
  }

  const numIntervals = 10
  const intervalLength = (now - startTime) / numIntervals

  const labels = []
  const dataPoints = []

  for (let i = 0; i < numIntervals; i++) {
    const bucketStart = startTime + i * intervalLength
    const bucketEnd = bucketStart + intervalLength
    
    const bucketRecords = records.filter(r => r.timestamp >= bucketStart && r.timestamp < bucketEnd)
    
    // Label is the midpoint of the bucket
    const bucketMid = bucketStart + intervalLength / 2
    let labelFormat = { month: 'short', day: 'numeric' }
    if (selectedTimeRange.value === '1w') {
      labelFormat = { weekday: 'short', hour: '2-digit' } // more granular for 1w
    } else if (selectedTimeRange.value === 'all' || selectedTimeRange.value === '3M') {
      labelFormat = { year: 'numeric', month: 'short' }
    }
    
    labels.push(new Date(bucketMid).toLocaleDateString('en-US', labelFormat))

    if (bucketRecords.length > 0) {
      const avgWPM = bucketRecords.reduce((sum, r) => sum + r.speedWPM, 0) / bucketRecords.length
      dataPoints.push(Math.round(avgWPM))
    } else {
      dataPoints.push(null) // Empty bucket
    }
  }

  return {
    labels,
    datasets: [
      {
        label: 'Average WPM',
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500
        borderColor: '#3b82f6', // blue-500
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3,
        spanGaps: true, // Connect lines across empty intervals
        data: dataPoints
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f1f5f9' // slate-100
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45
      }
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#1e293b', // slate-800
      padding: 12,
      titleFont: { size: 14 },
      bodyFont: { size: 14, weight: 'bold' },
      displayColors: false
    }
  }
}

// --- Table Data ---
const sortedRecords = computed(() => {
  // Sort from newest to oldest for the table
  return [...typingStore.records].sort((a, b) => b.timestamp - a.timestamp)
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return sortedRecords.value.slice(start, end)
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRecords.value.length / pageSize)))

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

// --- Formatters & Helpers ---
const formatDate = (ts) => {
  return new Date(ts).toLocaleString()
}

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

const getMaterialName = (id) => {
  if (!indexData.value.languages) return id
  for (const lang of indexData.value.languages) {
    const found = lang.materials.find(m => m.id === id)
    if (found) return found.name
  }
  return id
}
</script>
