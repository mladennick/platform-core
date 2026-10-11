import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import type { Organization } from "../types";

export function OrganizationPage() {
  const { user, refreshUser } = useAuth();
  const canManage = user?.permissions?.includes("manage_org");
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [vat, setVat] = useState("");
  const [domain, setDomain] = useState("");
  const [billing, setBilling] = useState(false);
  const [audit, setAudit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest<Organization>("/organization/");
        if (cancelled) return;
        setOrg(data);
        setName(data.name);
        setVat(data.vat_number ?? "");
        setDomain(data.domain ?? "");
        setBilling(Boolean(data.features?.billing));
        setAudit(data.features?.audit !== false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? "Could not load organization."
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name,
        vat_number: vat || null,
        domain: domain || null,
      };
      if (canManage) {
        body.features = { billing, audit };
      }
      const data = await apiRequest<Organization>("/organization/", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setOrg(data);
      setMessage("Organization updated.");
      await refreshUser();
    } catch {
      setError("Update failed (manage_org required).");
    }
  }

  if (loading) return <div className="centered">Loading…</div>;

  return (
    <section className="panel">
      <h1>Organization</h1>
      {org ? (
        <p className="muted">
          ID <code>{org.id}</code>
        </p>
      ) : null}
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={!canManage}
          />
        </label>
        <label>
          VAT number
          <input
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            disabled={!canManage}
          />
        </label>
        <label>
          Domain
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={!canManage}
          />
        </label>
        {canManage ? (
          <fieldset className="feature-set">
            <legend>Modules</legend>
            <label className="check">
              <input
                type="checkbox"
                checked={audit}
                onChange={(e) => setAudit(e.target.checked)}
              />
              Audit
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={billing}
                onChange={(e) => setBilling(e.target.checked)}
              />
              Billing
            </label>
          </fieldset>
        ) : null}
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {canManage ? (
          <button className="btn primary" type="submit">
            Save
          </button>
        ) : (
          <p className="muted">Read-only (missing manage_org).</p>
        )}
      </form>
    </section>
  );
}
