import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { saveRecord, getRecords } from '../db'

export const useTypingStore = defineStore('typing', {
  state: () => ({
    records: [],
    // Used for currently active session
    activeRecord: null,
  }),
  actions: {
    async loadRecords() {
      this.records = await getRecords()
    },
    
    startSession(articleId) {
      this.activeRecord = {
        id: uuidv4(),
        articleId,
        userId: 'default-user',
        startTime: Date.now(),
        timestamp: Date.now(),
        durationSeconds: 0,
        speedWPM: 0,
        activeSpeedWPM: 0,
        errors: 0,
        completed: false
      }
    },

    updateActiveSession(durationSeconds, speedWPM, activeSpeedWPM, errors) {
      if (!this.activeRecord) return
      this.activeRecord.durationSeconds = durationSeconds
      this.activeRecord.speedWPM = speedWPM
      
      // We keep activeSpeedWPM up to date. If user pauses, activeSpeedWPM is retained 
      // from the last moment they were typing
      if (activeSpeedWPM > 0) {
        this.activeRecord.activeSpeedWPM = activeSpeedWPM
      }
      
      this.activeRecord.errors = errors
      // Sync intermediate state
      this.saveCurrentSession()
    },

    async endSession() {
      if (!this.activeRecord) return
      this.activeRecord.completed = true
      await this.saveCurrentSession()
      await this.loadRecords()
      this.activeRecord = null
    },

    async saveCurrentSession() {
      if (this.activeRecord) {
        await saveRecord({...this.activeRecord})
      }
    }
  }
})
