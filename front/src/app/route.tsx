import { type RouteObject } from 'react-router-dom'
import Login from '../features/auth/page/Login'
import Register from '../features/auth/page/Register'
import Home from '../features/auth/page/Home'

export const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: 'login', element: <Login /> },
  { path: 'register', element: <Register /> },
]
