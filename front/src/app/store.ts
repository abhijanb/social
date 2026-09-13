import { configureStore } from '@reduxjs/toolkit'
import reducer from './reducer'
import { api } from './baseApi'

export const store = configureStore({
  reducer: reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
