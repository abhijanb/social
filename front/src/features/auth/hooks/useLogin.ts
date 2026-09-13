import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppDispatch } from '../../../app/hooks'
import { login, setUsername } from '../authSlice'
import { loginSchema, type LoginFormData } from '../schema'
import { useNavigate } from 'react-router-dom'

export function useLogin() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    dispatch(setUsername(data.username))
    dispatch(login())
    navigate('/')
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    onSubmit,
  }
}
