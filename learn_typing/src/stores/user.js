import { defineStore } from 'pinia'
import { saveUser, getUser } from '../db'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: 'default-user',
    name: 'Guest Player',
    isPaid: false,
    email: null,
    currentMaterialId: 'en_lesson1',
    currentProgressIndex: 0,
  }),
  actions: {
    async loadUser() {
      const u = await getUser('default-user')
      if (u) {
        this.id = u.id
        this.name = u.name
        this.isPaid = u.isPaid
        this.email = u.email
        this.currentMaterialId = u.currentMaterialId || 'en_lesson1'
        this.currentProgressIndex = u.currentProgressIndex || 0
      } else {
        await this.save()
      }
    },
    async save() {
      await saveUser({
        id: this.id,
        name: this.name,
        isPaid: this.isPaid,
        email: this.email,
        currentMaterialId: this.currentMaterialId,
        currentProgressIndex: this.currentProgressIndex,
      })
    },
    async updateProgress(materialId, index) {
      this.currentMaterialId = materialId
      this.currentProgressIndex = index
      await this.save()
    }
  }
})
