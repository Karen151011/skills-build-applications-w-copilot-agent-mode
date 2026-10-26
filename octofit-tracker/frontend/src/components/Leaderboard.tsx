import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';
export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." load={() => getJson<Record<string, unknown>>('/api/leaderboard')} collection="leaderboard" emptyMessage="No rankings yet." />;
}
