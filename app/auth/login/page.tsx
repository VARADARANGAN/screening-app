import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Login - Aptitude Screening Portal',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </main>
  );
}
