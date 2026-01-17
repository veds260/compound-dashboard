// Performance logging utility for tracking page and API load times

export function perfLog(label: string, startTime: number) {
  const duration = Date.now() - startTime
  const emoji = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴'
  console.log(`${emoji} [PERF] ${label}: ${duration}ms`)
  return duration
}

export function startPerf(): number {
  return Date.now()
}

// Client-side performance logging (logs to console)
export function clientPerfLog(label: string, startTime: number) {
  const duration = Date.now() - startTime
  const emoji = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴'
  console.log(`${emoji} [CLIENT-PERF] ${label}: ${duration}ms`)
  return duration
}
