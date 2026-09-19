import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader, StatusBanner, Table } from '../components/ui.jsx';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/reports').then(setData).catch((err) => setError(err.message));
  }, []);
  if (error) return <StatusBanner tone="error">{error}</StatusBanner>;
  if (!data) return <p>Loading reports…</p>;
  return (
    <div className="space-y-6">
      <PageHeader title="Operational reports" subtitle="Counts are limited to the signed-in institution." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total residents', data.totalResidents],
          ['Occupied beds', data.occupiedBeds],
          ['Vacant beds', data.vacantBeds],
          ['Currently outside', data.residentsCurrentlyOutside],
          ['Approved leave today', data.approvedLeaveToday],
          ['Overdue returns', data.overdueReturns],
          ['Mess enrolled', data.messEnrolledResidents],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-heading">{value}</p>
          </Card>
        ))}
      </div>
      <h2 className="text-lg">Mentor workload</h2>
      <Table
        columns={[
          { key: 'mentorId', label: 'Mentor' },
          { key: 'currentLoad', label: 'Load' },
          { key: 'capacity', label: 'Capacity' },
        ]}
        rows={data.mentorWorkload}
        rowKey="mentorId"
      />
      <h2 className="text-lg">Recent checkouts</h2>
      <Table
        columns={[
          { key: 'studentId', label: 'Student' },
          { key: 'checkOutAt', label: 'Checked out', render: (r) => (r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : '') },
        ]}
        rows={data.recentCheckouts}
      />
    </div>
  );
}
