import { Outlet } from 'react-router-dom'

export default function App() {

  return (
    <div>
      <nav>
        <a href="/">Home</a>
        <a href="/login">Login</a>
        <a href="/profile">Profile</a>
      </nav>
      <Outlet />
    </div>
  )
}
