import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  username: string
  avatarUrl: string | null
  isAuthenticated: boolean
}

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem('auth')
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AuthState>
      return {
        username: typeof parsed.username === 'string' ? parsed.username : '',
        avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : null,
        isAuthenticated: parsed.isAuthenticated === true,
      }
    }
  } catch {}
  return { username: '', avatarUrl: null, isAuthenticated: false }
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
    setAvatarUrl: (state, action: PayloadAction<string | null>) => {
      state.avatarUrl = action.payload
      persist(state)
    },
    login: (state) => {
      state.isAuthenticated = true
      persist(state)
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.username = ''
      state.avatarUrl = null
      try {
        localStorage.removeItem('auth')
      } catch {}
    },
  },
})

export const { setUsername, setAvatarUrl, login, logout } = authSlice.actions
export default authSlice.reducer
