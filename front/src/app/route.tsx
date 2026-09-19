import { type RouteObject } from 'react-router-dom'
import GuestLayout from './GuestLayout'
import ProtectedLayout from './ProtectedLayout'
import Login from '../pages/Login'
import Register from '../pages/Register'
import VerifyEmail from '../pages/VerifyEmail'
import UserSearchPage from '../pages/UserSearchPage'
import UsersPage from '../pages/UsersPage'
import FriendRequestsPage from '../pages/FriendRequestsPage'
import ChatPage from '../pages/ChatPage'
import FeedPage from '../pages/FeedPage'
import LivestreamPage from '../pages/LivestreamPage'
import ProfilePage from '../pages/ProfilePage'
import SavedPage from '../pages/SavedPage'
import SettingsPage from '../pages/SettingsPage'
import TagPage from '../pages/TagPage'

export const routes: RouteObject[] = [
  {
    element: <GuestLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'verify-email', element: <VerifyEmail /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/', element: <FeedPage /> },
      { path: 'u/:username', element: <ProfilePage /> },
      { path: 'tag/:tag', element: <TagPage /> },
      { path: 'search', element: <UserSearchPage /> },
      { path: 'live', element: <LivestreamPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'requests', element: <FriendRequestsPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'saved', element: <SavedPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]
