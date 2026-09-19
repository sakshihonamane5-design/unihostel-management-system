import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Button, Card, Field, Input, StatusBanner } from '../components/ui.jsx';

const initial = {
  institutionCode: 'SPIT',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  rollNumber: '',
  programme: 'B.Tech',
  department: 'Computer Science and Engineering',
  academicYear: '1',
  phone: '',
  emergencyName: '',
  emergencyPhone: '',
  relation: 'Parent',
};

export default function RegisterPage() {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/auth/register', {
        institutionCode: form.institutionCode,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        rollNumber: form.rollNumber,
        programme: form.programme,
        department: form.department,
        academicYear: form.academicYear,
        phone: form.phone,
        emergencyContact: {
          name: form.emergencyName,
          phone: form.emergencyPhone,
          relation: form.relation,
        },
      });
      setMessage('Registration submitted. Wait for hostel administration to approve your account.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-page px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Card>
          <h1 className="text-2xl">Student registration</h1>
          <p className="mt-1 text-sm">You can only register as a student. Staff roles are assigned by an administrator.</p>
          {error ? <div className="mt-3"><StatusBanner tone="error">{error}</StatusBanner></div> : null}
          {message ? <div className="mt-3"><StatusBanner tone="success">{message}</StatusBanner></div> : null}
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            {Object.entries({
              institutionCode: 'Institution code',
              firstName: 'First name',
              lastName: 'Last name',
              email: 'Email',
              password: 'Password',
              rollNumber: 'Roll number',
              programme: 'Programme',
              department: 'Department',
              academicYear: 'Academic year',
              phone: 'Phone',
              emergencyName: 'Emergency contact name',
              emergencyPhone: 'Emergency contact phone',
              relation: 'Relation',
            }).map(([key, label]) => (
              <Field key={key} label={label}>
                <Input
                  type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  required
                />
              </Field>
            ))}
            <div className="sm:col-span-2">
              <Button type="submit">Submit registration</Button>
            </div>
          </form>
          <p className="mt-4 text-sm">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
