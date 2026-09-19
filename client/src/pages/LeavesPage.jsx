import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Button, Card, Field, Input, PageHeader, StatusBanner, Table } from '../components/ui.jsx';

export default function LeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [passes, setPasses] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.get('/leaves');
      setLeaves(data.leaves);
      if (user.role !== 'ADMIN') {
        const mine = await api.get('/gate-passes/mine');
        setPasses(mine.gatePasses);
      }
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, [user.role]);

  return (
    <div className="space-y-6">
      <PageHeader title="Leave requests" subtitle="Approved leave issues a QR-ready gate pass code. No biometrics or GPS are used." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {user.role !== 'ADMIN' ? (
        <Card>
          <h2 className="mb-3 text-lg">Submit leave</h2>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.target));
              try {
                await api.post('/leaves', {
                  destination: data.destination,
                  reason: data.reason,
                  departureDate: data.departureDate,
                  expectedReturnDate: data.expectedReturnDate,
                  emergencyContact: { name: data.emergencyName, phone: data.emergencyPhone },
                });
                e.target.reset();
                load();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <Field label="Destination"><Input name="destination" required /></Field>
            <Field label="Reason"><Input name="reason" required /></Field>
            <Field label="Departure"><Input name="departureDate" type="datetime-local" required /></Field>
            <Field label="Expected return"><Input name="expectedReturnDate" type="datetime-local" required /></Field>
            <Field label="Emergency name"><Input name="emergencyName" required /></Field>
            <Field label="Emergency phone"><Input name="emergencyPhone" required /></Field>
            <div className="sm:col-span-2"><Button type="submit">Submit request</Button></div>
          </form>
        </Card>
      ) : null}
      <Table
        columns={[
          { key: 'destination', label: 'Destination' },
          { key: 'status', label: 'Status' },
          { key: 'lateReturn', label: 'Late', render: (r) => (r.lateReturn ? 'Yes' : 'No') },
          {
            key: 'act',
            label: 'Decision',
            render: (row) =>
              user.role === 'ADMIN' && row.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <Button onClick={async () => { await api.post(`/leaves/${row._id}/decision`, { decision: 'APPROVED' }); load(); }}>Approve</Button>
                  <Button variant="ghost" onClick={async () => { await api.post(`/leaves/${row._id}/decision`, { decision: 'REJECTED' }); load(); }}>Reject</Button>
                </div>
              ) : null,
          },
        ]}
        rows={leaves}
      />
      {passes.length ? (
        <Card>
          <h2 className="mb-3 text-lg">My gate passes</h2>
          <ul className="space-y-2 text-sm">
            {passes.map((p) => (
              <li key={p.id}>
                <strong>{p.publicCode}</strong> · {p.status} · valid until {new Date(p.validUntil).toLocaleString()}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
