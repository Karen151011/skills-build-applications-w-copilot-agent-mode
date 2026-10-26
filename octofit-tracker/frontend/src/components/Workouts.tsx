import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';
export default function Workouts() {
  const userEmail = 'mona@example.com';
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." load={() => getJson<Record<string, unknown>>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)} collection="suggestions" emptyMessage="No workout suggestions yet." />;
}
