import api from './axiosInstance'

export const register = (data) =>
  api.post('/auth/register', data).then(r => r.data)

// identifier = phone (customer) or email (admin); the backend sniffs '@' and resolves accordingly.
export const login = (identifier, password) =>
  api.post('/auth/login', { identifier, password }).then(r => r.data)
