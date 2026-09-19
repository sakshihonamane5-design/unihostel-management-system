import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Button, Card, Field, Input, PageHeader, StatusBanner, Table, TextArea } from '../components/ui.jsx';

export default function MentorsPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ mentors: [], assignments: [], coverage: {} });
  const [error, setError] = useState('');

  async function load() {
    try {
      setData(await api.get('/mentors/dashboard'));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Senior-student mentorship" subtitle="Assignments use least-loaded eligible mentors. Meeting notes stay restricted from mentees." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm">Active mentors</p>
          <p className="mt-2 text-3xl font-semibold text-heading">{data.coverage.activeMentors ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-sm">Assigned mentees</p>
          <p className="mt-2 text-3xl font-semibold text-heading">{data.coverage.assignedMentees ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-sm">Remaining capacity</p>
          <p className="mt-2 text-3xl font-semibold text-heading">{data.coverage.remainingCapacity ?? '—'}</p>
        </Card>
      </div>
      {user.role === 'ADMIN' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleForm
            title="Designate mentor"
            path="/mentors"
            fields={[['userId', 'User ID'], ['capacity', 'Capacity']]}
            transform={(d) => ({ ...d, capacity: Number(d.capacity || 8), eligibleHostelIds: d.eligibleHostelIds ? [d.eligibleHostelIds] : [] })}
            extra={<Field label="Eligible hostel ID"><Input name="eligibleHostelIds" /></Field>}
            onDone={load}
          />
          <SimpleForm title="Auto-assign mentee" path="/mentors/assign" fields={[['menteeId', 'Mentee student ID']]} onDone={load} />
        </div>
      ) : null}
      <Table
        columns={[
          { key: 'currentLoad', label: 'Load', render: (m) => `${m.currentLoad} / ${m.capacity}` },
          { key: 'active', label: 'Active', render: (m) => String(m.active) },
          { key: 'userId', label: 'Mentor', render: (m) => m.userId?.email || m.userId },
        ]}
        rows={data.mentors}
      />
      <SimpleForm title="Record check-in" path="/mentors/check-ins" fields={[['assignmentId', 'Assignment ID']]} extra={<Field label="Restricted notes"><TextArea name="notes" /></Field>} onDone={load} />
      <SimpleForm title="Escalate to warden" path="/mentors/escalations" fields={[['assignmentId', 'Assignment ID'], ['reason', 'Reason']]} extra={<Field label="Private notes"><TextArea name="privateNotes" /></Field>} onDone={load} />
    </div>
  );
}

function SimpleForm({ title, path, fields, extra, transform, onDone }) {
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
          const data = Object.fromEntries(new FormData(e.target));
          try {
            await api.post(path, transform ? transform(data) : data);
            e.target.reset();
            onDone();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        {fields.map(([name, label]) => (
          <Field key={name} label={label}>
            <Input name={name} required />
          </Field>
        ))}
        {extra}
        <Button type="submit">Submit</Button>
      </form>
    </Card>
  );
}
