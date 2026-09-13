import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  username: string
  isAuthenticated: boolean
}

const initialState: AuthState = {
  username: '',
  isAuthenticated: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload
    },
    login: (state) => {
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.username = ''
    },
  },
})

export const { setUsername, login, logout } = authSlice.actions
export default authSlice.reducer
