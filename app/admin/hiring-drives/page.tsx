'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

interface HiringDrive {
  id: string;
  name: string;
  is_active: boolean;
  min_cgpa: number | null;
  max_active_backlogs: number | null;
  eligible_branches: string[];
  graduation_years: number[];
  require_work_auth: boolean;
  created_at: string;
}

export default function HiringDrivesPage() {
  const router = useRouter();
  const [drives, setDrives] = useState<HiringDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState<HiringDrive | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [minCgpa, setMinCgpa] = useState('');
  const [maxBacklogs, setMaxBacklogs] = useState('');
  const [eligibleBranches, setEligibleBranches] = useState('');
  const [graduationYears, setGraduationYears] = useState('');
  const [requireWorkAuth, setRequireWorkAuth] = useState(false);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/admin/hiring-drives', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrives(data.drives || []);
    } catch (e) {
      console.error('Failed to fetch hiring drives', e);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDrive(null);
    setName('');
    setIsActive(true);
    setMinCgpa('');
    setMaxBacklogs('');
    setEligibleBranches('');
    setGraduationYears('');
    setRequireWorkAuth(false);
    setIsModalOpen(true);
  };

  const openEditModal = (drive: HiringDrive) => {
    setEditingDrive(drive);
    setName(drive.name);
    setIsActive(drive.is_active);
    setMinCgpa(drive.min_cgpa ? drive.min_cgpa.toString() : '');
    setMaxBacklogs(drive.max_active_backlogs !== null ? drive.max_active_backlogs.toString() : '');
    setEligibleBranches(drive.eligible_branches.join(', '));
    setGraduationYears(drive.graduation_years.join(', '));
    setRequireWorkAuth(drive.require_work_auth);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Name is required');

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        name,
        is_active: isActive,
        min_cgpa: minCgpa ? parseFloat(minCgpa) : null,
        max_active_backlogs: maxBacklogs ? parseInt(maxBacklogs) : null,
        eligible_branches: eligibleBranches ? eligibleBranches.split(',').map(b => b.trim()).filter(b => b) : [],
        graduation_years: graduationYears ? graduationYears.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y)) : [],
        require_work_auth: requireWorkAuth,
      };

      if (editingDrive) {
        await axios.put(`/api/admin/hiring-drives/${editingDrive.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/admin/hiring-drives', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setIsModalOpen(false);
      fetchDrives();
    } catch (e) {
      console.error('Failed to save hiring drive', e);
      alert('Failed to save hiring drive');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hiring drive?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/hiring-drives/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDrives();
    } catch (e) {
      console.error('Failed to delete hiring drive', e);
      alert('Failed to delete hiring drive');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hiring Drives</h1>
            <p className="text-slate-500 text-xs mt-1">Manage recruitment drives and eligibility rules</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/dashboard">
              <Button variant="outline" className="border-slate-200 text-xs">Dashboard</Button>
            </Link>
            <Button onClick={openCreateModal} className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md">
              + New Hiring Drive
            </Button>
          </div>
        </div>

        <Card className="border border-slate-150 rounded-2xl shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/70">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Drive Name</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Min CGPA</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Max Backlogs</TableHead>
                  <TableHead className="font-semibold text-slate-700">Eligible Branches</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : drives.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No hiring drives created yet</TableCell></TableRow>
                ) : (
                  drives.map(drive => (
                    <TableRow key={drive.id} className="text-sm">
                      <TableCell className="font-bold text-slate-800">{drive.name}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${drive.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {drive.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono">{drive.min_cgpa !== null ? drive.min_cgpa : '-'}</TableCell>
                      <TableCell className="text-center font-mono">{drive.max_active_backlogs !== null ? drive.max_active_backlogs : '-'}</TableCell>
                      <TableCell className="text-slate-600 truncate max-w-[200px]">
                        {drive.eligible_branches.length > 0 ? drive.eligible_branches.join(', ') : 'All Branches'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(drive)} className="mr-2 text-xs">Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(drive.id)} className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200">Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 border-b pb-2">
              {editingDrive ? 'Edit Hiring Drive' : 'Create Hiring Drive'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Drive Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2027 Campus Recruitment" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Minimum CGPA</label>
                <Input type="number" step="0.1" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} placeholder="e.g. 7.0" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Maximum Active Backlogs</label>
                <Input type="number" value={maxBacklogs} onChange={(e) => setMaxBacklogs(e.target.value)} placeholder="e.g. 2" />
              </div>
              
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Eligible Branches (comma separated)</label>
                <Input value={eligibleBranches} onChange={(e) => setEligibleBranches(e.target.value)} placeholder="e.g. CSE, ISE, ECE (Leave empty for all)" />
              </div>
              
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Graduation Years (comma separated)</label>
                <Input value={graduationYears} onChange={(e) => setGraduationYears(e.target.value)} placeholder="e.g. 2027, 2028 (Leave empty for all)" />
              </div>
              
              <div className="col-span-2 flex items-center gap-2 mt-2">
                <input type="checkbox" id="workAuth" checked={requireWorkAuth} onChange={(e) => setRequireWorkAuth(e.target.checked)} className="rounded" />
                <label htmlFor="workAuth" className="text-xs font-bold text-slate-700">Requires valid Work Authorization / ID</label>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700">Drive is Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button variant="outline" className="border-slate-200" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button className="bg-blue-900 hover:bg-blue-800 text-white font-bold" onClick={handleSave}>
                Save Drive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
