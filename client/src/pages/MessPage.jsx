import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Button, Card, Field, Input, PageHeader, StatusBanner, Table } from '../components/ui.jsx';

export default function MessPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    setRows((await api.get('/mess')).enrolments);
  }
  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function exportCsv() {
    const header = 'studentId,messName,plan,status,startDate,endDate';
    const body = rows
      .map((r) => [r.studentId, r.messName, r.plan, r.status, r.startDate, r.endDate || ''].join(','))
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mess-enrolment.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mess enrolment registry"
        subtitle="Enrolment status only. Menus, attendance, inventory, kitchen management and billing are out of scope."
        action={user.role === 'ADMIN' ? <Button variant="ghost" onClick={exportCsv}>Export list</Button> : null}
      />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {user.role === 'ADMIN' ? (
        <Card>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.target));
              try {
                await api.post('/mess', data);
                e.target.reset();
                load();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <Field label="Student ID"><Input name="studentId" required /></Field>
            <Field label="Mess name"><Input name="messName" required /></Field>
            <Field label="Plan"><Input name="plan" required /></Field>
            <Field label="Start date"><Input name="startDate" type="date" required /></Field>
            <div className="sm:col-span-2"><Button type="submit">Save enrolment</Button></div>
          </form>
        </Card>
      ) : null}
      <Table
        columns={[
          { key: 'messName', label: 'Mess' },
          { key: 'plan', label: 'Plan' },
          { key: 'status', label: 'Status' },
          { key: 'startDate', label: 'Start', render: (r) => new Date(r.startDate).toLocaleDateString() },
        ]}
        rows={rows}
      />
    </div>
  );
}
