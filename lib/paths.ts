import os from 'os'
import path from 'path'
import fs from 'fs'

const BASE = os.tmpdir()

/** Returns an ensured temp directory path, e.g. getTempDir('l9-audio') */
export function getTempDir(...segments: string[]): string {
  const dir = path.join(BASE, ...segments)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

/** Returns a temp file path (ensures parent dir exists) */
export function getTempPath(subdir: string, filename: string): string {
  const dir = getTempDir(subdir)
  return path.join(dir, filename)
}

/** Database path */
export const DB_PATH = path.join(BASE, 'l9-pipeline.db')
