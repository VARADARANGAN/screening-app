'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Branch management is handled via the student profile.
// This route redirects to the admin dashboard.
export default function BranchesPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/dashboard'); }, [router]);
  return null;
}
