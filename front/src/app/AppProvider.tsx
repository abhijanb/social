import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { store } from './store'
import { Provider } from 'react-redux'
import { routes } from './route'
import App from '../App'

const router = createBrowserRouter([{ element: <App />, children: routes }])

export default function AppProvider() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  )
}
