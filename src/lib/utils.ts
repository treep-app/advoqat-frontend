import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple function to get the site URL
export const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  return 'https://app.advoqat.com'
}

// Production logger utility
const enableLogs = process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true' || process.env.NODE_ENV !== 'production'

export const logger = {
  log: (...args: unknown[]) => {
    if (enableLogs) {
      console.log(...args)
    }
  },
  error: (...args: unknown[]) => {
    if (enableLogs) {
      console.error(...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (enableLogs) {
      console.warn(...args)
    }
  },
  info: (...args: unknown[]) => {
    if (enableLogs) {
      console.info(...args)
    }
  },
  debug: (...args: unknown[]) => {
    if (enableLogs) {
      console.debug(...args)
    }
  },
  // Special method for critical errors that should always be logged
  critical: (...args: unknown[]) => {
    console.error('[CRITICAL]', ...args)
  }
}
