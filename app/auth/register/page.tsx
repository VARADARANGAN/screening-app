import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Register - Aptitude Screening Portal',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <RegisterForm />
    </main>
  );
}
