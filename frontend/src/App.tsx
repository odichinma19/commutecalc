import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  addOption, createPlan, deleteOption, deletePlan, getComparison, getPlans,
} from "./api";
import type { Comparison, Plan, Priority } from "./types";
import "./App.css";

export default function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [priority, setPriority] = useState<Priority>("cost");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    try {
      setPlans(await getPlans());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (selectedId === null) return;
    getComparison(selectedId, priority)
      .then(setComparison)
      .catch((e) => setError(e.message));
  }, [selectedId, priority, version]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      const plan = await createPlan({
        name: String(f.get("name")),
        origin: String(f.get("origin")),
        destination: String(f.get("destination")),
        distance_km: Number(f.get("distance_km")),
        trips_per_week: Number(f.get("trips_per_week")),
      });
      form.reset();
      setError("");
      await loadPlans();
      setSelectedId(plan.id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await deletePlan(id);
      if (selectedId === id) {
        setSelectedId(null);
        setComparison(null);
      }
      await loadPlans();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAddOption(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedId === null) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const pass = String(f.get("monthly_pass_price"));
    try {
      await addOption(selectedId, {
        mode: String(f.get("mode")),
        price_per_trip: Number(f.get("price_per_trip")),
        duration_min: Number(f.get("duration_min")),
        monthly_pass_price: pass === "" ? null : Number(pass),
        riders: Number(f.get("riders") || 1),
      });
      form.reset();
      setError("");
      setVersion((v) => v + 1);
      await loadPlans();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteOption(optionId: number) {
    if (selectedId === null) return;
    try {
      await deleteOption(selectedId, optionId);
      setVersion((v) => v + 1);
      await loadPlans();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const selected = plans.find((p) => p.id === selectedId);

  return (
    <main className="app">
      <h1>CommuteCalc</h1>
      <p className="subtitle">
        Compare train, bus and carpool for a long-distance commute, over a month.
      </p>

      <div className="track" aria-hidden="true">
        <svg className="train" viewBox="0 0 176 44" width="176" height="44">
          <rect x="0" y="6" width="52" height="26" rx="5" fill="#1f7a5a" />
          <rect x="56" y="6" width="52" height="26" rx="5" fill="#1f7a5a" />
          <rect x="112" y="6" width="52" height="26" rx="5" fill="#17614a" />
          <path d="M164 6 h4 q8 4 8 26 h-12z" fill="#17614a" />
          <rect x="6" y="12" width="10" height="9" rx="2" fill="#fff" />
          <rect x="22" y="12" width="10" height="9" rx="2" fill="#fff" />
          <rect x="62" y="12" width="10" height="9" rx="2" fill="#fff" />
          <rect x="78" y="12" width="10" height="9" rx="2" fill="#fff" />
          <rect x="118" y="12" width="10" height="9" rx="2" fill="#fff" />
          <rect x="134" y="12" width="10" height="9" rx="2" fill="#fff" />
          <circle cx="14" cy="36" r="4" fill="#1c2733" />
          <circle cx="40" cy="36" r="4" fill="#1c2733" />
          <circle cx="70" cy="36" r="4" fill="#1c2733" />
          <circle cx="96" cy="36" r="4" fill="#1c2733" />
          <circle cx="126" cy="36" r="4" fill="#1c2733" />
          <circle cx="152" cy="36" r="4" fill="#1c2733" />
        </svg>
      </div>

      {error && <div className="error">Something went wrong: {error}</div>}

      <form className="card" onSubmit={handleCreate}>
        <h2>New commute plan</h2>
        <div className="form-grid">
          <label>
            Name
            <input name="name" placeholder="Weekly commute" required />
          </label>
          <label>
            From
            <input name="origin" placeholder="Lodz" required minLength={2} />
          </label>
          <label>
            To
            <input name="destination" placeholder="Gdansk" required minLength={2} />
          </label>
          <label>
            Distance (km)
            <input name="distance_km" type="number" placeholder="330"
                   required min={5} step="any" />
          </label>
          <label>
            One-way trips per week
            <input name="trips_per_week" type="number" placeholder="3"
                   required min={1} max={14} />
          </label>
        </div>
        <button className="primary" type="submit">Add plan</button>
      </form>

      <section className="card">
        <h2>Your plans</h2>
        {loading && <p className="empty">Loading…</p>}
        {!loading && plans.length === 0 && (
          <p className="empty">No plans yet. Add one above.</p>
        )}
        <ul className="plan-list">
          {plans.map((p) => (
            <li className="plan-row" key={p.id}>
              <button
                className={`plan-button ${p.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(p.id)}
              >
                <strong>{p.name}</strong>: {p.origin} to {p.destination},{" "}
                {p.trips_per_week} trips a week
              </button>
              <button className="danger" onClick={() => handleDelete(p.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected && comparison && (
        <section className="card">
          <h2>{selected.name}</h2>
          <p className="note">
            About {comparison.trips_per_month} one-way trips a month.
          </p>
          <div className="priority">
            Rank by:
            {(["cost", "time", "co2"] as Priority[]).map((p) => (
              <button
                key={p}
                className={priority === p ? "selected" : ""}
                onClick={() => setPriority(p)}
              >
                {p === "co2" ? "CO₂" : p}
              </button>
            ))}
          </div>

          {comparison.results.length === 0 && (
            <p className="empty">No options yet. Add a way to travel below.</p>
          )}
          {comparison.results.map((r) => (
            <div className="result" key={r.option_id}>
              <div>
                <span className="mode">{r.rank}. {r.mode}</span>
                {r.rank === 1 && (
                  <span className="badge best">
                    best for {priority === "co2" ? "CO₂" : priority}
                  </span>
                )}
                {r.uses_pass && <span className="badge">monthly pass</span>}
                <div className="numbers">
                  {r.monthly_cost} PLN / month · {Math.round(r.monthly_minutes / 60)} h
                  travelling · {r.monthly_co2_kg} kg CO₂
                </div>
                {r.break_even_trips !== null && (
                  <p className="insight">
                    The pass pays off from {r.break_even_trips} trips a month.
                  </p>
                )}
              </div>
              <button className="danger" onClick={() => handleDeleteOption(r.option_id)}>
                Remove
              </button>
            </div>
          ))}

          <form onSubmit={handleAddOption}>
            <h3>Add an option</h3>
            <div className="form-grid">
              <label>
                Way to travel
                <select name="mode" defaultValue="train">
                  <option value="train">train</option>
                  <option value="bus">bus</option>
                  <option value="carpool">carpool</option>
                  <option value="car">car</option>
                </select>
              </label>
              <label>
                Price per trip (PLN)
                <input name="price_per_trip" type="number" placeholder="80"
                       required min={0} step="any" />
              </label>
              <label>
                Minutes per trip
                <input name="duration_min" type="number" placeholder="240"
                       required min={1} />
              </label>
              <label>
                Monthly pass (optional)
                <input name="monthly_pass_price" type="number" placeholder="300"
                       min={0} step="any" />
              </label>
              <label>
                Riders (carpool)
                <input name="riders" type="number" placeholder="1" min={1} max={8} />
              </label>
            </div>
            <button className="primary" type="submit">Add option</button>
          </form>

          <p className="note">
            Prices and times are your own estimates, not live data. One trip means one
            one-way journey. For carpool, the price is the whole car's cost, split between
            the riders.
          </p>
        </section>
      )}
    </main>
  );
}