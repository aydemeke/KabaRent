import api from './axiosInstance'

export const getAll = (params = {}) =>
  api.get('/kabas', { params }).then(r => r.data)

export const getById = (id) =>
  api.get(`/kabas/${id}`).then(r => r.data)

export const create = (data) =>
  api.post('/kabas', data).then(r => r.data)

export const update = (id, data) =>
  api.put(`/kabas/${id}`, data).then(r => r.data)

export const softDelete = (id) =>
  api.delete(`/kabas/${id}`)

export const checkAvailability = (id, eventDate, returnDate) =>
  api.get(`/kabas/${id}/availability`, { params: { eventDate, returnDate } }).then(r => r.data)

export const getAvailable = (eventDate, returnDate) =>
  api.get('/kabas/available', { params: { eventDate, returnDate } }).then(r => r.data)
