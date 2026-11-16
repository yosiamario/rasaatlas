import pg from 'pg'
import { applyMigrations } from './migrate.js'

const { Pool } = pg

const connectionString = (process.env.DATABASE_URL || '').trim()

const isLocalHost = /(^|@)(localhost|127\.0\.0\.1)(:|\/|$)/.test(connectionString)

/**
 * Satu pool koneksi dipakai bersama seluruh route.
 * Supabase mewajibkan TLS. Sertifikat pooler tidak selalu ada di trust store
 * Node, jadi verifikasi rantai dimatikan (koneksi tetap terenkripsi).
 */
export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString && !isLocalHost ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
})

export function assertDatabaseConfig() {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL belum diset. Salin connection string Supabase (Project Settings → Database → Connection string → URI) ke backend/.env.',
    )
  }
}

/** Jalankan satu query. Parameter selalu memakai placeholder $1, $2, ... */
export function query(text, params) {
  return pool.query(text, params)
}

let schemaReady = null

/**
 * Jalankan migrasi database yang belum diterapkan.
 * Aman dipanggil berkali-kali: versi yang sudah tercatat di `schema_migrations`
 * akan dilewati.
 */
export function ensureSchema() {
  assertDatabaseConfig()
  if (!schemaReady) {
    schemaReady = applyMigrations((text, params) => pool.query(text, params))
      .then(({ applied }) => {
        if (applied.length) {
          console.log(`[db] migrasi diterapkan: ${applied.join(', ')}`)
        }
        return true
      })
      .catch((error) => {
        schemaReady = null
        throw error
      })
  }
  return schemaReady
}

/** Label aman untuk log (tanpa password). */
export function databaseLabel() {
  if (!connectionString) return 'DATABASE_URL belum diset'
  try {
    const url = new URL(connectionString)
    const database = url.pathname.replace(/^\//, '') || 'postgres'
    return `${url.hostname}/${database}`
  } catch {
    return 'Supabase'
  }
}

export async function closePool() {
  await pool.end()
}
