import { type RouteObject } from 'react-router-dom'
import Login from '../features/auth/page/Login'
import Register from '../features/auth/page/Register'
import UserSearchPage from '../features/search/page/UserSearchPage'
import UsersPage from '../features/users/UsersPage'

export const routes: RouteObject[] = [
  { path: '/', element: <UserSearchPage /> },
  { path: 'login', element: <Login /> },
  { path: 'register', element: <Register /> },
  { path: 'users', element: <UsersPage /> },
]
