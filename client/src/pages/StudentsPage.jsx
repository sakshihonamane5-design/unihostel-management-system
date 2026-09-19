import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Field, Input, PageHeader, Select, StatusBanner, Table } from '../components/ui.jsx';

export default function StudentsPage() {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [u, s] = await Promise.all([api.get('/users'), api.get('/students')]);
      setUsers(u.users);
      setStudents(s.students);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    await api.post(`/users/${id}/approve`);
    load();
  }
  async function setRole(id, role) {
    await api.patch(`/users/${id}/role`, { role });
    load();
  }
  async function archive(id) {
    await api.post(`/students/${id}/archive`);
    load();
  }

  return (
    <div>
      <PageHeader title="Students and accounts" subtitle="Approve registrations and assign staff roles. Historical records are archived, not deleted." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <h2 className="mb-3 text-lg">Accounts</h2>
      <Table
        columns={[
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role', render: (row) => `${row.firstName} ${row.lastName} · ${row.role}` },
          { key: 'status', label: 'Status' },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                {row.status === 'PENDING' ? (
                  <Button onClick={() => approve(row._id)}>Approve</Button>
                ) : null}
                <Select defaultValue={row.role} onChange={(e) => setRole(row._id, e.target.value)}>
                  <option>STUDENT</option>
                  <option>MENTOR</option>
                  <option>ADMIN</option>
                  <option>GATE_SECURITY</option>
                </Select>
              </div>
            ),
          },
        ]}
        rows={users}
      />
      <h2 className="mb-3 mt-8 text-lg">Student profiles</h2>
      <Table
        columns={[
          { key: 'rollNumber', label: 'Roll no.' },
          { key: 'department', label: 'Department' },
          { key: 'academicYear', label: 'Year' },
          { key: 'residencyStatus', label: 'Residency' },
          {
            key: 'archive',
            label: 'Archive',
            render: (row) => (
              <Button variant="ghost" onClick={() => archive(row._id)}>
                Archive
              </Button>
            ),
          },
        ]}
        rows={students}
      />
      <form
        className="mt-8 grid max-w-xl gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target));
          await api.patch(`/users/${data.userId}/status`, { status: data.status });
          load();
        }}
      >
        <h2 className="text-lg">Account status</h2>
        <Field label="User ID">
          <Input name="userId" required />
        </Field>
        <Field label="Status">
          <Select name="status">
            <option>ACTIVE</option>
            <option>SUSPENDED</option>
            <option>ARCHIVED</option>
            <option>PENDING</option>
          </Select>
        </Field>
        <Button type="submit">Update status</Button>
      </form>
    </div>
  );
}
