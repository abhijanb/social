import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { baseApi } from '../../app/baseApi'
import type { AppDispatch } from '../../app/store'

interface AuthState {
  userId: string
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
        userId: typeof parsed.userId === 'string' ? parsed.userId : '',
        username: typeof parsed.username === 'string' ? parsed.username : '',
        avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : null,
        isAuthenticated: parsed.isAuthenticated === true,
      }
    }
  } catch {}
  return { userId: '', username: '', avatarUrl: null, isAuthenticated: false }
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
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload
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
      state.userId = ''
      state.username = ''
      state.avatarUrl = null
      try {
        localStorage.removeItem('auth')
      } catch {}
    },
  },
})

export const { setUserId, setUsername, setAvatarUrl, login, logout } = authSlice.actions
export default authSlice.reducer

// Full logout: clears the auth mirror + wipes the RTK Query cache (which
// also aborts in-flight queries). Every logout path must use this instead
// of bare logout() — otherwise the next login flashes the prior account's
// cached data (getMe and other same-arg queries resolve stale instantly).
export const logoutAndReset = () => (dispatch: AppDispatch) => {
  dispatch(logout())
  dispatch(baseApi.util.resetApiState())
}
