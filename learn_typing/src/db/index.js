import { openDB } from 'idb'

const DB_NAME = 'learn_typing_db'
const DB_VERSION = 3

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('typing_records')) {
        const recordStore = db.createObjectStore('typing_records', { keyPath: 'id' })
        recordStore.createIndex('userId', 'userId')
        recordStore.createIndex('timestamp', 'timestamp')
      }
      if (!db.objectStoreNames.contains('game_records')) {
        const gameStore = db.createObjectStore('game_records', { keyPath: 'id', autoIncrement: true })
        gameStore.createIndex('score', 'score')
        gameStore.createIndex('timestamp', 'timestamp')
      }
      if (!db.objectStoreNames.contains('diaries')) {
        const diaryStore = db.createObjectStore('diaries', { keyPath: 'id' })
        diaryStore.createIndex('date', 'date')
        diaryStore.createIndex('updatedAt', 'updatedAt')
      }
    },
  })
}

export async function saveRecord(record) {
  const db = await initDB()
  return db.put('typing_records', record)
}

export async function getRecords() {
  const db = await initDB()
  return db.getAllFromIndex('typing_records', 'timestamp')
}

export async function saveGameRecord(record) {
  const db = await initDB()
  return db.add('game_records', record)
}

export async function getGameRecords() {
  const db = await initDB()
  return db.getAllFromIndex('game_records', 'timestamp')
}

export async function saveUser(user) {
  const db = await initDB()
  return db.put('users', user)
}

export async function getUser(id) {
  const db = await initDB()
  return db.get('users', id)
}

export async function saveDiary(diary) {
  const db = await initDB()
  return db.put('diaries', diary)
}

export async function getDiaries() {
  const db = await initDB()
  const diaries = await db.getAll('diaries')
  return diaries.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getDiary(id) {
  const db = await initDB()
  return db.get('diaries', id)
}

export async function deleteDiary(id) {
  const db = await initDB()
  return db.delete('diaries', id)
}

export async function getDiaryByDate(date) {
  const db = await initDB()
  return db.getFromIndex('diaries', 'date', date)
}
