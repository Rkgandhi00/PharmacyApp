const BASE = '/api'

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}

export const getConfig    = ()         => request('/config')
export const getMedicines = (search)   => request(search ? `/medicines?search=${encodeURIComponent(search)}` : '/medicines')
export const addMedicine  = (data)     => request('/medicines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteMedicine = (id)     => request(`/medicines/${id}`, { method: 'DELETE' })
export const restockMedicine = (id, data) => request(`/medicines/${id}/restock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const getSales     = ()         => request('/sales')
export const recordSale   = (data)     => request('/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
