import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Button, Card, Field, Input, PageHeader, Select, StatusBanner, Table, TextArea } from '../components/ui.jsx';

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    setNotices((await api.get('/notices')).notices);
  }
  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Notices" subtitle="Institution, hostel and role-specific notices. Important notices can be acknowledged." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {user.role === 'ADMIN' ? (
        <Card>
          <h2 className="mb-3 text-lg">Publish notice</h2>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.target));
              try {
                await api.post('/notices', {
                  title: data.title,
                  body: data.body,
                  scope: data.scope,
                  hostelId: data.hostelId || undefined,
                  roles: data.role ? [data.role] : [],
                  important: data.important === 'on',
                  expiresAt: data.expiresAt || undefined,
                });
                e.target.reset();
                load();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <Field label="Title"><Input name="title" required /></Field>
            <Field label="Scope">
              <Select name="scope">
                <option>INSTITUTION</option>
                <option>HOSTEL</option>
                <option>ROLE</option>
              </Select>
            </Field>
            <div className="sm:col-span-2"><Field label="Body"><TextArea name="body" required /></Field></div>
            <Field label="Hostel ID (if hostel notice)"><Input name="hostelId" /></Field>
            <Field label="Role (if role notice)">
              <Select name="role">
                <option value="">None</option>
                <option>STUDENT</option>
                <option>MENTOR</option>
                <option>GATE_SECURITY</option>
                <option>ADMIN</option>
              </Select>
            </Field>
            <Field label="Expires"><Input name="expiresAt" type="date" /></Field>
            <label className="flex items-center gap-2 text-sm text-heading">
              <input type="checkbox" name="important" /> Important
            </label>
            <div className="sm:col-span-2"><Button type="submit">Publish</Button></div>
          </form>
        </Card>
      ) : null}
      <Table
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'scope', label: 'Scope' },
          { key: 'important', label: 'Important', render: (n) => (n.important ? 'Yes' : 'No') },
          {
            key: 'ack',
            label: 'Acknowledge',
            render: (n) =>
              n.important ? (
                <Button variant="ghost" onClick={async () => { await api.post(`/notices/${n._id}/acknowledge`); load(); }}>
                  Acknowledge
                </Button>
              ) : null,
          },
        ]}
        rows={notices}
      />
    </div>
  );
}
