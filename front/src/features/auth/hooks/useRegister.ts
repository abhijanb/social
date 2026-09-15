import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppDispatch } from '../../../app/hooks'
import { login, setUsername } from '../authSlice'
import { registerSchema, type RegisterFormData } from '../schema'
import { useRegisterUserMutation } from '../../users/usersApi'
import { useNavigate } from 'react-router-dom'

export function useRegister() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [registerUser, { isLoading, error }] = useRegisterUserMutation()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Express error envelope: { status: 'error', message, error: { suggestions } }
  const errorData =
    error && 'data' in error
      ? (error.data as {
          message?: string
          error?: { suggestions?: string[] }
        })
      : null
  const suggestions: string[] = errorData?.error?.suggestions ?? []
  const errorMessage = errorData?.message ?? (error ? 'Registration failed' : null)

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({ username: data.username, password: data.password }).unwrap()
      dispatch(setUsername(data.username))
      dispatch(login())
      navigate('/')
    } catch {
      // error handled via `error`
    }
  }

  const selectSuggestion = (username: string) => {
    form.setValue('username', username, { shouldValidate: true, shouldDirty: true })
    form.clearErrors('username')
    form.setFocus('username')
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    onSubmit,
    isLoading,
    error,
    errorMessage,
    suggestions,
    selectSuggestion,
    setValue: form.setValue,
  }
}
