import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, Field, Input, PageHeader, StatusBanner, Table } from '../components/ui.jsx';

export default function ResidenciesPage() {
  const [history, setHistory] = useState({ allocations: [], residencies: [] });
  const [error, setError] = useState('');

  async function load() {
    try {
      setHistory(await api.get('/residencies/history'));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Residency and allocation" subtitle="Check-in, transfer and checkout keep a full allocation history." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <ActionCard title="Check in" path="/residencies/check-in" fields={[['studentId', 'Student ID'], ['hostelId', 'Hostel ID'], ['bedId', 'Bed ID']]} onDone={load} />
        <ActionCard title="Transfer bed" path="/residencies/transfer" fields={[['studentId', 'Student ID'], ['newBedId', 'New bed ID']]} onDone={load} />
        <ActionCard title="Checkout" path="/residencies/check-out" fields={[['studentId', 'Student ID'], ['notes', 'Notes']]} onDone={load} />
      </div>
      <h2 className="text-lg">Allocation history</h2>
      <Table
        columns={[
          { key: 'studentId', label: 'Student' },
          { key: 'bedId', label: 'Bed' },
          { key: 'status', label: 'Status' },
          { key: 'allocatedAt', label: 'Allocated', render: (r) => new Date(r.allocatedAt).toLocaleString() },
        ]}
        rows={history.allocations}
      />
    </div>
  );
}

function ActionCard({ title, path, fields, onDone }) {
  const [error, setError] = useState('');
  return (
    <Card>
      <h2 className="mb-3 text-lg">{title}</h2>
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          try {
            await api.post(path, Object.fromEntries(new FormData(e.target)));
            e.target.reset();
            onDone();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        {fields.map(([name, label]) => (
          <Field key={name} label={label}>
            <Input name={name} required={name !== 'notes'} />
          </Field>
        ))}
        <Button type="submit">Submit</Button>
      </form>
    </Card>
  );
}
