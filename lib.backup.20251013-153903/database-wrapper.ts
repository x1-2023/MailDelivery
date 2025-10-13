/**
 * Database wrapper with retry logic for handling SQLITE_BUSY errors
 */

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 100

export async function retryOnBusy<T>(
  operation: () => T,
  context: string = "Database operation"
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return operation()
    } catch (error: any) {
      lastError = error
      
      // Only retry on SQLITE_BUSY
      if (error.code === 'SQLITE_BUSY' && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt // Exponential backoff
        console.warn(`${context} - SQLITE_BUSY (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Not SQLITE_BUSY or max retries reached
      throw error
    }
  }
  
  throw lastError || new Error(`${context} failed after ${MAX_RETRIES} attempts`)
}
