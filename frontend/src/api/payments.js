import api from './axiosInstance'

export const create = (data) =>
  api.post('/payments', data).then(r => r.data)

export const getByOrder = (orderId) =>
  api.get(`/payments/order/${orderId}`).then(r => r.data)

export const getBalance = (orderId) =>
  api.get(`/payments/order/${orderId}/balance`).then(r => r.data)

export const getAll = () =>
  api.get('/payments').then(r => r.data)
