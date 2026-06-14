import axios from 'axios'

//Locally
//const api = axios.create({
//  baseURL: 'http://localhost:8080/api',
//  headers: { 'Content-Type': 'application/json' },
//})

//Remote server
const api = axios.create({
  baseURL: 'https://kabarent.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
})
export default api
