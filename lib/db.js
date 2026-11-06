import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

let config = null
try {
  const configPath = path.join(process.cwd(), 'config.js')
  if (fs.existsSync(configPath)) {
    const mod = await import(`file://${configPath}`)
    config = mod.default || mod
  }
} catch (e) {
  config = {}
}

const MONGO_URI = process.env.MONGO_URI || config.mongo?.uri || 'mongodb://localhost:27017/whatsapp_bot'
const DB_NAME = process.env.MONGO_DB || config.mongo?.dbName || 'whatsapp_bot'

const userSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  exp: { type: Number, default: 0, index: true },
  lvl: { type: Number, default: 1, index: true },
  birthday: { type: String, default: null },
  hobby: { type: String, default: null },
  marry: { type: String, default: null },
  edad: { type: Number, default: null },
  rango: { type: String, default: 'Novato 🌱' },
  genre: { type: String, default: null },
  description: { type: String, default: null },
  warns: { type: Number, default: 0 }
}, { timestamps: true, collection: 'users' })

const User = mongoose.models.User || mongoose.model('User', userSchema)

const getUserCache = new Map()
const CACHE_TTL = 30000

let connected = false
let connectRetry = null

export async function connectDB() {
  if (connected && mongoose.connection.readyState === 1) return true
  if (connectRetry) return false
  
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      family: 4
    })
    connected = true
    console.log('[DB] Conectado a MongoDB (Mongoose) correctamente')
    return true
  } catch (e) {
    console.log('[DB] Error conectando a MongoDB:', e.message)
    connected = false
    if (!connectRetry) {
      connectRetry = setTimeout(() => {
        connectRetry = null
        connectDB()
      }, 30000)
    }
    return false
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    connected = false
    getUserCache.clear()
  }
}

function cleanNum(raw) {
  if (!raw) return ''
  let s = String(raw)
  if (s.includes('@')) s = s.split('@')[0]
  if (s.includes(':')) s = s.split(':')[0]
  return s.replace(/\D/g, '')
}

function expForLevel(lvl) {
  return Math.floor(100 * Math.pow(1.5, lvl - 1))
}

function getRango(lvl) {
  if (lvl < 5) return 'Novato 🌱'
  if (lvl < 10) return 'Aventurero ⚔️'
  if (lvl < 20) return 'Guerrero 🔥'
  if (lvl < 35) return 'Maestro 💎'
  if (lvl < 50) return 'Leyenda 🌠'
  return 'Dios 👑'
}

export { expForLevel, getRango }

export async function registerUser(number, name = '') {
  if (!(await connectDB())) return null
  const num = cleanNum(number)
  if (!num) return null
  try {
    let user = await User.findOne({ number: num })
    if (user) {
      if (name && user.name !== name) {
        user.name = name
        await user.save()
        getUserCache.delete(num)
      }
      return user.toObject()
    }
    user = await User.create({ number: num, name: name || '' })
    getUserCache.set(num, { data: user.toObject(), time: Date.now() })
    return user.toObject()
  } catch (e) {
    if (e.code === 11000) {
      const retry = await User.findOne({ number: num })
      return retry ? retry.toObject() : null
    }
    return null
  }
}

export async function getUser(number) {
  if (!(await connectDB())) return null
  const num = cleanNum(number)
  if (!num) return null
  const cached = getUserCache.get(num)
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data
  try {
    const user = await User.findOne({ number: num }).lean()
    if (user) {
      getUserCache.set(num, { data: user, time: Date.now() })
      return user
    }
    return null
  } catch (e) {
    return null
  }
}

export async function getAllUsers(limit = 0) {
  if (!(await connectDB())) return []
  try {
    let query = User.find({}).sort({ exp: -1, lvl: -1 }).lean()
    if (limit > 0) query = query.limit(limit)
    return await query
  } catch (e) {
    return []
  }
}

export async function updateUser(number, data) {
  if (!(await connectDB())) return null
  const num = cleanNum(number)
  if (!num) return null
  const update = { ...data }
  delete update.number
  delete update._id
  try {
    const user = await User.findOneAndUpdate(
      { number: num },
      { $set: update },
      { new: true, upsert: true }
    ).lean()
    getUserCache.delete(num)
    return user
  } catch (e) {
    return null
  }
}

export async function deleteUser(number) {
  if (!(await connectDB())) return false
  const num = cleanNum(number)
  if (!num) return false
  try {
    const result = await User.deleteOne({ number: num })
    getUserCache.delete(num)
    return result.deletedCount > 0
  } catch (e) {
    return false
  }
}

export async function addExp(number, amount, name = '') {
  if (!(await connectDB())) return null
  const num = cleanNum(number)
  if (!num) return null
  try {
    let user = await User.findOne({ number: num })
    if (!user) user = await User.create({ number: num, name: name || '' })
    if (name && user.name !== name) user.name = name
    let newExp = (user.exp || 0) + amount
    let newLvl = user.lvl || 1
    let leveledUp = false
    let needed = expForLevel(newLvl)
    while (newExp >= needed) {
      newExp -= needed
      newLvl++
      leveledUp = true
      needed = expForLevel(newLvl)
    }
    user.exp = newExp
    user.lvl = newLvl
    user.rango = getRango(newLvl)
    await user.save()
    getUserCache.delete(num)
    return {
      number: num,
      exp: newExp,
      lvl: newLvl,
      rango: user.rango,
      leveledUp,
      needed: expForLevel(newLvl),
      name: user.name
    }
  } catch (e) {
    return null
  }
}

export async function levelUp(number) {
  if (!(await connectDB())) return null
  const num = cleanNum(number)
  if (!num) return null
  try {
    const user = await User.findOne({ number: num })
    if (!user) return null
    user.lvl = (user.lvl || 1) + 1
    user.rango = getRango(user.lvl)
    await user.save()
    getUserCache.delete(num)
    return { number: num, lvl: user.lvl, rango: user.rango }
  } catch (e) {
    return null
  }
}

export async function addWarn(number) {
  if (!(await connectDB())) return null
  const num = cleanNum(number)
  if (!num) return null
  try {
    const user = await User.findOneAndUpdate(
      { number: num },
      { $inc: { warns: 1 } },
      { new: true }
    ).lean()
    getUserCache.delete(num)
    return user?.warns ?? null
  } catch (e) {
    return null
  }
}

export async function removeWarn(number) {
  if (!(await connectDB())) return null
  const num = cleanNum(number)
  if (!num) return null
  try {
    const user = await User.findOne({ number: num })
    if (!user) return null
    user.warns = Math.max(0, (user.warns || 0) - 1)
    await user.save()
    getUserCache.delete(num)
    return user.warns
  } catch (e) {
    return null
  }
}

export async function getUserCount() {
  if (!(await connectDB())) return 0
  try {
    return await User.countDocuments()
  } catch (e) {
    return 0
  }
}

export async function getTopUsers(limit = 10) {
  if (!(await connectDB())) return []
  try {
    return await User.find({}).sort({ lvl: -1, exp: -1 }).limit(limit).lean()
  } catch (e) {
    return []
  }
}

export async function syncUserName(number, pushName) {
  if (!(await connectDB())) return null
  const num = cleanNum(number)
  if (!num || !pushName) return null
  try {
    const user = await User.findOne({ number: num })
    if (!user) return await registerUser(num, pushName)
    if (user.name !== pushName) {
      user.name = pushName
      await user.save()
      getUserCache.delete(num)
      return user.toObject()
    }
    getUserCache.set(num, { data: user.toObject(), time: Date.now() })
    return user.toObject()
  } catch (e) {
    return null
  }
}

export { User }