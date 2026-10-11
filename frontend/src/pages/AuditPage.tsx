import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "../lib/api";
import type { AuditEvent, Paginated } from "../types";

export function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest<Paginated<AuditEvent>>("/audit/events/");
        if (!cancelled) setEvents(data.results);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? "Could not load audit events (feature/permission?)."
              : "Network error.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="centered">Loading…</div>;

  return (
    <section className="panel">
      <h1>Audit log</h1>
      <p className="muted">Recent security and admin actions for your organization.</p>
      {error ? <p className="error">{error}</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Action</th>
            <th>Actor</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id}>
              <td>{new Date(ev.created_at).toLocaleString()}</td>
              <td>{ev.action}</td>
              <td>{ev.actor_username ?? "—"}</td>
              <td>
                {ev.entity_type}
                {ev.entity_id ? ` · ${ev.entity_id.slice(0, 8)}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!error && events.length === 0 ? (
        <p className="muted">No events yet.</p>
      ) : null}
    </section>
  );
}
