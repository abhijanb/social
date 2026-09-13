import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  username: string
}

const initialState: AuthState = {
  username: '',
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload
    },
  },
})

export const { setUsername } = authSlice.actions
export default authSlice.reducer
