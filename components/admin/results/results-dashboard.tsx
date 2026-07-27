'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Search, ArrowUpDown, Loader2 } from 'lucide-react';

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export function ResultsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/results', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.results || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to load results', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    
    if (searchTerm) {
      sortableItems = sortableItems.filter(item => 
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle nulls
        if (aVal === null) aVal = -1;
        if (bVal === null) bVal = -1;

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig, searchTerm]);

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  const renderSortableHeader = (label: string, key: string) => (
    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort(key)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="py-4"><CardTitle className="text-sm font-medium text-gray-500">Attempted / Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.attempted} / {summary.completed}</div></CardContent></Card>
          <Card><CardHeader className="py-4"><CardTitle className="text-sm font-medium text-gray-500">Avg Overall Score</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.averages.overall}%</div></CardContent></Card>
          <Card><CardHeader className="py-4"><CardTitle className="text-sm font-medium text-gray-500">Avg Tech (Apt/Code)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.averages.aptitude}% / {summary.averages.coding}%</div></CardContent></Card>
          <Card><CardHeader className="py-4"><CardTitle className="text-sm font-medium text-gray-500">Avg Qual (Beh/Lrn/AI)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.averages.behaviour}% / {summary.averages.learning}% / {summary.averages.aiLiteracy}%</div></CardContent></Card>
        </div>
      )}

      {/* Table Section */}
      <Card>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by student name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {renderSortableHeader('Student Name', 'studentName')}
                {renderSortableHeader('Aptitude', 'aptitudeScore')}
                {renderSortableHeader('Coding', 'codingScore')}
                {renderSortableHeader('Behaviour', 'behaviourScore')}
                {renderSortableHeader('Learning', 'learningScore')}
                {renderSortableHeader('AI Literacy', 'aiLiteracyScore')}
                {renderSortableHeader('Overall', 'overallScore')}
                {renderSortableHeader('Recommendation', 'recommendation')}
                {renderSortableHeader('Status', 'status')}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8">No results found.</TableCell></TableRow>
              ) : (
                sortedData.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.studentName}</TableCell>
                    <TableCell>{row.aptitudeScore !== null ? `${row.aptitudeScore}%` : '-'}</TableCell>
                    <TableCell>{row.codingScore !== null ? `${row.codingScore}%` : '-'}</TableCell>
                    <TableCell>{row.behaviourScore !== null ? `${row.behaviourScore}%` : '-'}</TableCell>
                    <TableCell>{row.learningScore !== null ? `${row.learningScore}%` : '-'}</TableCell>
                    <TableCell>{row.aiLiteracyScore !== null ? `${row.aiLiteracyScore}%` : '-'}</TableCell>
                    <TableCell className="font-bold">{row.overallScore !== null ? `${row.overallScore}%` : '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.recommendation === 'Highly Recommended' ? 'bg-green-100 text-green-800' :
                        row.recommendation === 'Recommended' ? 'bg-emerald-100 text-emerald-800' :
                        row.recommendation === 'Consider' ? 'bg-yellow-100 text-yellow-800' :
                        row.recommendation === 'Needs Further Review' ? 'bg-orange-100 text-orange-800' :
                        row.recommendation === 'Not Recommended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.recommendation}
                      </span>
                    </TableCell>
                    <TableCell className="uppercase text-xs font-semibold text-gray-500">{row.status}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/admin/results/${row.id}`)}>
                        View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
