import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppDispatch } from '../../../app/hooks'
import { login, setAvatarUrl, setUserId, setUsername } from '../authSlice'
import { loginSchema, type LoginFormData } from '../schema'
import { useLoginUserMutation } from '../authApi'
import { useResendVerificationMutation } from '../../users/usersApi'
import { useNavigate } from 'react-router-dom'

export function useLogin() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [loginUser, { isLoading, error }] = useLoginUserMutation()
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const errorData = error && 'data' in error ? (error.data as { message?: string }) : null
  const errorMessage = errorData?.message ?? (error ? 'Login failed' : null)

  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = await loginUser({ username: data.username, password: data.password }).unwrap()
      dispatch(setUserId(user.id))
      dispatch(setUsername(user.username))
      dispatch(setAvatarUrl(user.avatarUrl ?? null))
      dispatch(login())
      navigate('/')
    } catch {
      // error handled via errorMessage
    }
  }

  const resend = async () => {
    const username = form.getValues('username')
    if (!username) return
    try {
      await resendVerification({ username }).unwrap()
    } catch {
      // error handled via mutation state
    }
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    onSubmit,
    isLoading,
    error,
    errorMessage,
    resend,
    isResending,
  }
}
