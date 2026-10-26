import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';
export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." load={() => getJson<Record<string, unknown>>('/api/activities')} collection="activities" emptyMessage="No activities yet." />;
}
