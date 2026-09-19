import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, Field, Input, PageHeader, Select, StatusBanner, Table } from '../components/ui.jsx';

export default function HostelsPage() {
  const [tree, setTree] = useState({ hostels: [], rooms: [], beds: [] });
  const [error, setError] = useState('');

  async function load() {
    try {
      setTree(await api.get('/hostels/tree'));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Hostel structure" subtitle="Hostels, blocks, floors, rooms and beds for this institution." />
      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <StructureForm title="Create hostel" fields={[['name', 'Name'], ['code', 'Code']]} path="/hostels" onDone={load} />
        <StructureForm title="Create block" fields={[['hostelId', 'Hostel ID'], ['name', 'Name'], ['code', 'Code']]} path="/blocks" onDone={load} />
        <StructureForm title="Create floor" fields={[['blockId', 'Block ID'], ['name', 'Name']]} extra={<Field label="Number"><Input name="number" type="number" required /></Field>} transform={(data) => ({ ...data, number: Number(data.number) })} path="/floors" onDone={load} />
        <StructureForm
          title="Create room"
          fields={[['floorId', 'Floor ID'], ['number', 'Room number']]}
          extra={
            <>
              <Field label="Type">
                <Select name="type">
                  <option>SINGLE</option>
                  <option>DOUBLE</option>
                  <option>TRIPLE</option>
                  <option>DORM</option>
                </Select>
              </Field>
              <Field label="Capacity">
                <Input name="capacity" type="number" required />
              </Field>
            </>
          }
          transform={(data) => ({ ...data, capacity: Number(data.capacity) })}
          path="/rooms"
          onDone={load}
        />
        <StructureForm title="Create bed" fields={[['roomId', 'Room ID'], ['code', 'Bed code']]} path="/beds" onDone={load} />
      </div>
      <Table
        columns={[
          { key: 'number', label: 'Room' },
          { key: 'type', label: 'Type' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'occupied', label: 'Occupied' },
          { key: 'vacant', label: 'Vacant' },
        ]}
        rows={tree.rooms}
      />
    </div>
  );
}

function StructureForm({ title, fields, extra, path, transform, onDone }) {
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
        <Button type="submit">Save</Button>
      </form>
    </Card>
  );
}
