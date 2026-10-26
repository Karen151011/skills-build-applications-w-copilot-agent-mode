import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  collection: string;
  emptyMessage: string;
};

export function CapabilityCard({ title, description, endpoint, collection, emptyMessage }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);

    getJson<Record<string, unknown>>(endpoint)
      .then((response) => {
        const result = response[collection];
        if (!Array.isArray(result)) throw new Error('The API returned an invalid response');
        if (active) setItems(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load data');
      });

    return () => {
      active = false;
    };
  }, [collection, endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p> : items === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={String(item._id ?? index)}>
                {Object.entries(item)
                  .filter(([key]) => key !== '_id' && key !== '__v')
                  .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
                  .join(' · ')}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
