import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, Field, Input, PageHeader, StatusBanner, TextArea } from '../components/ui.jsx';

export default function ProfilePage() {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .get('/students/me')
      .then((data) => setStudent(data.student))
      .catch((err) => setError(err.message));
  }, []);

  if (!student && !error) return <p>Loading profile…</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" subtitle="Health information is limited to emergency contact, optional accessibility needs, and consented allergy notes." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}
      {student ? (
        <Card>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.target));
              try {
                const res = await api.patch('/students/me', {
                  phone: data.phone,
                  accessibilityRequirement: data.accessibilityRequirement,
                  allergyConsented: Boolean(data.allergyConsented),
                  allergyNote: data.allergyNote,
                  emergencyContact: {
                    name: data.emergencyName,
                    phone: data.emergencyPhone,
                    relation: data.relation,
                  },
                });
                setStudent(res.student);
                setMessage('Profile updated');
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <p className="sm:col-span-2 text-sm">Roll number {student.rollNumber} · {student.programme} · Year {student.academicYear}</p>
            <Field label="Phone"><Input name="phone" defaultValue={student.phone} /></Field>
            <Field label="Accessibility requirement"><Input name="accessibilityRequirement" defaultValue={student.accessibilityRequirement} /></Field>
            <Field label="Emergency name"><Input name="emergencyName" defaultValue={student.emergencyContact?.name} /></Field>
            <Field label="Emergency phone"><Input name="emergencyPhone" defaultValue={student.emergencyContact?.phone} /></Field>
            <Field label="Relation"><Input name="relation" defaultValue={student.emergencyContact?.relation} /></Field>
            <label className="flex items-center gap-2 text-sm text-heading">
              <input type="checkbox" name="allergyConsented" defaultChecked={student.allergyConsented} /> I consent to store a critical allergy note
            </label>
            <div className="sm:col-span-2">
              <Field label="Allergy note"><TextArea name="allergyNote" defaultValue={student.allergyNote} /></Field>
            </div>
            <div className="sm:col-span-2"><Button type="submit">Save</Button></div>
          </form>
        </Card>
      ) : null}
      <Card>
        <h2 className="mb-3 text-lg">Emergency assistance</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const { message: msg } = Object.fromEntries(new FormData(e.target));
            try {
              await api.post('/emergency-assist', { message: msg });
              setMessage('Private assistance request sent to the warden.');
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <Field label="Private message to warden"><TextArea name="message" required /></Field>
          <Button type="submit">Send private request</Button>
        </form>
      </Card>
    </div>
  );
}
