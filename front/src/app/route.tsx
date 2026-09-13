import type { RouteObject } from 'react-router-dom'
import Login from '../pages/Login'
import Profile from '../pages/Profile'

export const routes: RouteObject[] = [
  { path: '/', element: <Login /> },
  { path: 'login', element: <Login /> },
  { path: 'profile', element: <Profile /> },
]
