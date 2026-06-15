import api from './axiosInstance'

export const getAll = (status) =>
  api.get('/orders', { params: status ? { status } : {} }).then(r => r.data)

export const getById = (id) =>
  api.get(`/orders/${id}`).then(r => r.data)

export const create = (data) =>
  api.post('/orders', data).then(r => r.data)

export const updateStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status }).then(r => r.data)

export const getByCustomer = (customerId) =>
  api.get(`/orders/customer/${customerId}`).then(r => r.data)

// --- Customer self-service (/api/my/**) — customer id is derived from the JWT server-side ---

export const getMyOrders = () =>
  api.get('/my/orders').then(r => r.data)

export const getMyOrder = (id) =>
  api.get(`/my/orders/${id}`).then(r => r.data)

export const getMyOrderBalance = (id) =>
  api.get(`/my/orders/${id}/balance`).then(r => r.data)

export const cancelMyOrder = (id) =>
  api.post(`/my/orders/${id}/cancel`).then(r => r.data)
