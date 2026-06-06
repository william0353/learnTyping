import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    soundEnabled: JSON.parse(localStorage.getItem('soundEnabled') ?? 'true'),
    soundType: localStorage.getItem('soundType') || 'water'
  }),
  actions: {
    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      localStorage.setItem('soundEnabled', JSON.stringify(this.soundEnabled))
    },
    setSoundType(type) {
      this.soundType = type
      localStorage.setItem('soundType', type)
    },
    playSound() {
      if (!this.soundEnabled) return
      // Create a new Audio object each time to allow overlapping sounds
      const audio = new Audio(`/tap/${this.soundType}.mp3`)
      audio.volume = 0.5
      audio.play().catch(() => {})
    }
  }
})
