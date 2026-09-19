import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader, StatusBanner, Table } from '../components/ui.jsx';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/audit')
      .then((data) => setLogs(data.logs))
      .catch((err) => setError(err.message));
  }, []);
  return (
    <div>
      <PageHeader title="Audit log" subtitle="Passwords, tokens and secrets are never stored in audit metadata." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <Table
        columns={[
          { key: 'action', label: 'Action' },
          { key: 'resourceType', label: 'Resource' },
          { key: 'resourceId', label: 'ID' },
          { key: 'createdAt', label: 'When', render: (r) => new Date(r.createdAt).toLocaleString() },
        ]}
        rows={logs}
      />
    </div>
  );
}
