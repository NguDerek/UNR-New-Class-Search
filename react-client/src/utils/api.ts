const BASE_URL = 'http://localhost:5000'

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })

  if (res.status === 401) {
    // Guest tried to hit a protected route then send to login
    window.location.href = '/login'
    return null
  }

  return res
}