import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Card, EmptyState, PageHeader, StatusBanner } from '../components/ui.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/notices')
      .then((data) => setNotices(data.notices))
      .catch((err) => setError(err.message));
    if (user.role === 'ADMIN') {
      api
        .get('/reports')
        .then(setReports)
        .catch((err) => setError(err.message));
    }
  }, [user.role]);

  const stats = reports
    ? [
        ['Residents', reports.totalResidents],
        ['Occupied beds', reports.occupiedBeds],
        ['Vacant beds', reports.vacantBeds],
        ['Currently outside', reports.residentsCurrentlyOutside],
        ['Approved leave today', reports.approvedLeaveToday],
        ['Overdue returns', reports.overdueReturns],
        ['Mess enrolled', reports.messEnrolledResidents],
      ]
    : [];

  return (
    <div>
      <PageHeader title="Overview" subtitle="A calm snapshot of hostel operations for your institution." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {user.role === 'ADMIN' && stats.length ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => (
            <Card key={label}>
              <p className="text-sm">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-heading">{value}</p>
            </Card>
          ))}
        </div>
      ) : null}
      <h2 className="mb-3 text-lg">Notices</h2>
      {notices.length ? (
        <div className="space-y-3">
          {notices.map((notice) => (
            <Card key={notice._id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base">{notice.title}</h3>
                {notice.important ? <span className="text-xs font-semibold text-warning">Important</span> : null}
              </div>
              <p className="mt-2 text-sm">{notice.body}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No current notices" body="Institution and hostel notices will appear here." />
      )}
    </div>
  );
}
