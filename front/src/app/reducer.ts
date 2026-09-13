import authReducer from '../features/auth/authSlice'
import { api } from './baseApi'

const reducer = {
  auth: authReducer,
  [api.reducerPath]: api.reducer,
}

export default reducer