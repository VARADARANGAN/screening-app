'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BranchesManager() {
  const [branches, setBranches] = useState<any[]>([]);
  const [newBranch, setNewBranch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data } = await axios.get('/api/branches');
      setBranches(data.branches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addBranch = async () => {
    if (!newBranch.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/branches', { name: newBranch.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewBranch('');
      fetchBranches();
    } catch (e) {
      console.error(e);
      alert('Failed to create branch');
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/branches/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBranches();
    } catch (e) {
      console.error(e);
      alert('Failed to delete branch');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Loading branches...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <Link href="/admin/dashboard" className="font-extrabold text-slate-900 tracking-tight text-lg hover:opacity-90 transition">
              Campus<span className="text-blue-600 font-semibold">Screen</span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold ml-1 uppercase tracking-wider">
              Branches
            </span>
          </div>
          <div>
            <Link href="/admin/dashboard" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition">
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-6">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Branches Management</h1>
          <p className="text-xs text-slate-500 font-medium">Add, configure, or remove academic branches available for registration</p>
        </div>

        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-extrabold text-slate-900">Manage Branches</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">Configure college departments that students select during profile onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                value={newBranch} 
                onChange={e => setNewBranch(e.target.value)} 
                placeholder="E.g., CSE, ISE, MECH" 
                className="max-w-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
              />
              <Button onClick={addBranch} className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm cursor-pointer">
                Add Branch
              </Button>
            </div>
            
            <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-55">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Branch Name</TableHead>
                    <TableHead className="w-24 text-right font-semibold text-slate-700"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-slate-400 text-xs">No branches added.</TableCell>
                    </TableRow>
                  ) : (
                    branches.map(b => (
                      <TableRow key={b.id} className="hover:bg-slate-50/50 transition">
                        <TableCell className="font-bold text-slate-800 text-sm text-left">{b.name}</TableCell>
                        <TableCell className="text-right">
                          <button 
                            onClick={() => deleteBranch(b.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-100 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
