import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, Field, Input, PageHeader, Select, StatusBanner, Table } from '../components/ui.jsx';

export default function GatePage() {
  const [result, setResult] = useState(null);
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const data = await api.get('/gate/movements');
    setMovements(data.movements);
  }
  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Gate security desk" subtitle="Verify a signed/QR-ready pass or look up a student. Consecutive duplicate ENTRY or EXIT is rejected." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg">Verify gate pass</h2>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const { code } = Object.fromEntries(new FormData(e.target));
              try {
                setResult(await api.post('/gate/verify', { code }));
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <Field label="Pass code"><Input name="code" required /></Field>
            <Button type="submit">Verify</Button>
          </form>
          {result?.valid ? (
            <p className="mt-3 text-sm text-success">
              Valid pass for {result.student?.userId?.firstName} {result.student?.userId?.lastName} ({result.student?.rollNumber})
            </p>
          ) : null}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg">Record movement</h2>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const data = Object.fromEntries(new FormData(e.target));
              try {
                await api.post('/gate/movements', { code: data.code || undefined, studentId: data.studentId || undefined, type: data.type });
                load();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <Field label="Pass code"><Input name="code" /></Field>
            <Field label="Student ID fallback"><Input name="studentId" /></Field>
            <Field label="Type">
              <Select name="type">
                <option>EXIT</option>
                <option>ENTRY</option>
              </Select>
            </Field>
            <Button type="submit">Record</Button>
          </form>
        </Card>
      </div>
      <Card>
        <h2 className="mb-3 text-lg">Manual lookup</h2>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            const { rollNumber } = Object.fromEntries(new FormData(e.target));
            try {
              setResult(await api.get(`/gate/lookup?rollNumber=${encodeURIComponent(rollNumber)}`));
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <Field label="Roll number"><Input name="rollNumber" required /></Field>
          <div className="self-end"><Button type="submit">Look up</Button></div>
        </form>
      </Card>
      <Table
        columns={[
          { key: 'type', label: 'Type' },
          { key: 'studentId', label: 'Student' },
          { key: 'occurredAt', label: 'When', render: (r) => new Date(r.occurredAt).toLocaleString() },
        ]}
        rows={movements}
      />
    </div>
  );
}
