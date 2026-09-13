import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  username: string
  isAuthenticated: boolean
}

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem('auth')
    if (raw) return JSON.parse(raw) as AuthState
  } catch {}
  return { username: '', isAuthenticated: false }
}

const initialState: AuthState = loadAuth()

function persist(state: AuthState) {
  try {
    localStorage.setItem('auth', JSON.stringify(state))
  } catch {}
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload
      persist(state)
    },
    login: (state) => {
      state.isAuthenticated = true
      persist(state)
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.username = ''
      try {
        localStorage.removeItem('auth')
      } catch {}
    },
  },
})

export const { setUsername, login, logout } = authSlice.actions
export default authSlice.reducer
