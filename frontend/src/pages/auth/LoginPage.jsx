import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      const authData = res.data.data;

      if (authData.requires2FA) {
        navigate('/verify-otp', { state: { email: data.email } });
        toast.success('OTP sent to your email');
      } else {
        login(authData);
        toast.success('Login successful!');
        navigate(authData.role === 'ADMIN' || authData.role === 'TL' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome back</h1>
          <p className="text-text-light mt-1">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-9 w-4 h-4 text-text-light" />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 w-4 h-4 text-text-light" />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-text-light mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
