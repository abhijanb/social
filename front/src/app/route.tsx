import { type RouteObject } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import UserSearchPage from '../pages/UserSearchPage'
import UsersPage from '../pages/UsersPage'

export const routes: RouteObject[] = [
  { path: '/', element: <UserSearchPage /> },
  { path: 'login', element: <Login /> },
  { path: 'register', element: <Register /> },
  { path: 'users', element: <UsersPage /> },
]
