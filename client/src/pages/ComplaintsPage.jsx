import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Button, Card, Field, Input, PageHeader, Select, StatusBanner, Table, TextArea } from '../components/ui.jsx';

const NEXT = {
  OPEN: 'ACKNOWLEDGED',
  ACKNOWLEDGED: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
};

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    setItems((await api.get('/complaints')).complaints);
  }
  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Complaints" subtitle="Electrical, plumbing, cleanliness, furniture, internet and other issues follow a fixed status timeline." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <Card>
        <h2 className="mb-3 text-lg">New complaint</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            try {
              await api.post('/complaints', data);
              e.target.reset();
              load();
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <Field label="Category">
            <Select name="category">
              <option>ELECTRICAL</option>
              <option>PLUMBING</option>
              <option>CLEANLINESS</option>
              <option>FURNITURE</option>
              <option>INTERNET</option>
              <option>OTHER</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select name="priority">
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>URGENT</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description"><TextArea name="description" required /></Field>
          </div>
          <Field label="Image URL (optional)"><Input name="imageUrl" /></Field>
          <div className="self-end"><Button type="submit">Submit</Button></div>
        </form>
      </Card>
      <Table
        columns={[
          { key: 'category', label: 'Category' },
          { key: 'priority', label: 'Priority' },
          { key: 'status', label: 'Status' },
          { key: 'description', label: 'Description' },
          {
            key: 'next',
            label: 'Advance',
            render: (row) =>
              user.role === 'ADMIN' && NEXT[row.status] ? (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await api.patch(`/complaints/${row._id}`, { status: NEXT[row.status] });
                    load();
                  }}
                >
                  {NEXT[row.status]}
                </Button>
              ) : null,
          },
        ]}
        rows={items}
      />
    </div>
  );
}
