import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';
export default function Teams() {
  return <CapabilityCard title="Teams" description="Manage teams and members." load={() => getJson<Record<string, unknown>>('/api/teams')} collection="teams" emptyMessage="No teams yet." />;
}
