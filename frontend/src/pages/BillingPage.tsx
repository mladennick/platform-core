import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import type { Plan, Subscription } from "../types";

export function BillingPage() {
  const { user } = useAuth();
  const canManage = user?.permissions?.includes("manage_billing");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [planData, subData] = await Promise.all([
      apiRequest<Plan[] | { results: Plan[] }>("/billing/plans/"),
      apiRequest<Subscription>("/billing/subscription/"),
    ]);
    const list = Array.isArray(planData) ? planData : planData.results;
    setPlans(list);
    setSubscription(subData);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? "Billing unavailable (enable feature billing on the organization)."
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

  async function selectPlan(code: string) {
    setMessage(null);
    setError(null);
    try {
      const sub = await apiRequest<Subscription>("/billing/subscription/", {
        method: "PATCH",
        body: JSON.stringify({ plan_code: code, status: "active" }),
      });
      setSubscription(sub);
      setMessage(`Plan set to ${code}.`);
    } catch {
      setError("Could not update subscription.");
    }
  }

  if (loading) return <div className="centered">Loading…</div>;

  return (
    <section className="panel">
      <h1>Billing</h1>
      <p className="muted">Stub billing module — Stripe webhooks later.</p>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {subscription ? (
        <div className="meta-grid">
          <div>
            <dt>Current plan</dt>
            <dd>{subscription.plan_detail?.name ?? subscription.plan}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{subscription.status}</dd>
          </div>
        </div>
      ) : null}

      <div className="card-grid">
        {plans.map((plan) => (
          <div key={plan.id} className="nav-card">
            <h3>{plan.name}</h3>
            <p>
              {(plan.price_cents / 100).toFixed(2)} / {plan.interval}
            </p>
            {canManage ? (
              <button
                type="button"
                className="btn primary"
                onClick={() => selectPlan(plan.code)}
              >
                Select
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
