import { type RouteObject } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import UserSearchPage from '../pages/UserSearchPage'
import UsersPage from '../pages/UsersPage'
import FriendRequestsPage from '../pages/FriendRequestsPage'

export const routes: RouteObject[] = [
  { path: '/', element: <UserSearchPage /> },
  { path: 'login', element: <Login /> },
  { path: 'register', element: <Register /> },
  { path: 'users', element: <UsersPage /> },
  { path: 'requests', element: <FriendRequestsPage /> },
]
