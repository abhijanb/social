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

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    onSubmit,
    isLoading,
    error,
  }
}
