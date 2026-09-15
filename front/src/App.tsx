import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'

export default function App() {
  return (
    // Bottom padding clears the mobile tab bar (sm+ has no bottom bar).
    <div className="min-h-screen bg-white pb-16 dark:bg-[#16171d] sm:pb-0">
      <Navbar />
      <Outlet />
    </div>
  )
}
