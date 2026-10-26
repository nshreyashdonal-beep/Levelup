/**
 * locationStorage.js
 * Utility to persist and retrieve visitor geolocation coordinates across
 * page navigations, component unmounts, and browser reloads.
 */

const STORAGE_KEY = 'levelup_visitor_location'

/**
 * Retrieve saved visitor location coordinates from browser storage.
 * Checks sessionStorage first (current session priority), then localStorage.
 * Validates that latitude and longitude are valid finite numbers.
 *
 * @returns {{ latitude: number, longitude: number } | null}
 */
export function getSavedVisitorLocation() {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const lat = Number(parsed?.latitude)
    const lng = Number(parsed?.longitude)

    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng }
    }
  } catch (err) {
    console.warn('Failed to parse saved visitor location:', err)
  }

  return null
}

/**
 * Save visitor location coordinates to browser storage (both sessionStorage and localStorage).
 *
 * @param {{ latitude: number, longitude: number }} coords
 */
export function saveVisitorLocation(coords) {
  if (typeof window === 'undefined' || !coords) return

  const lat = Number(coords.latitude)
  const lng = Number(coords.longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

  const payload = JSON.stringify({
    latitude: lat,
    longitude: lng,
    savedAt: new Date().toISOString(),
  })

  try {
    sessionStorage.setItem(STORAGE_KEY, payload)
  } catch (err) {
    console.warn('Failed to save visitor location to sessionStorage:', err)
  }

  try {
    localStorage.setItem(STORAGE_KEY, payload)
  } catch (err) {
    console.warn('Failed to save visitor location to localStorage:', err)
  }
}

/**
 * Clear saved visitor location from both sessionStorage and localStorage.
 */
export function clearSavedVisitorLocation() {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {}

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
