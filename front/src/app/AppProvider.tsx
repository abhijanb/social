import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { store } from './store'
import { Provider } from 'react-redux'
import { routes } from './route'

const router = createBrowserRouter(routes)

export default function AppProvider() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  )
}
