import api from './axiosInstance'

export const getAll = () =>
  api.get('/customers').then(r => r.data)

export const getById = (id) =>
  api.get(`/customers/${id}`).then(r => r.data)

export const create = (data) =>
  api.post('/customers', data).then(r => r.data)

export const update = (id, data) =>
  api.put(`/customers/${id}`, data).then(r => r.data)
