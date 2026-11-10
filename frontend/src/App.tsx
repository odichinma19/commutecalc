import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  addOption, createPlan, deleteOption, deletePlan, getComparison, getPlans,
} from "./api";
import type { Comparison, Plan, Priority } from "./types";

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
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>CommuteCalc</h1>
      {error && <p style={{ color: "crimson" }}>Something went wrong: {error}</p>}

      <form onSubmit={handleCreate}>
        <h2>New commute plan</h2>
        <input name="name" placeholder="Name" required />{" "}
        <input name="origin" placeholder="From" required minLength={2} />{" "}
        <input name="destination" placeholder="To" required minLength={2} />{" "}
        <input name="distance_km" type="number" placeholder="Distance (km)"
               required min={1} step="any" />{" "}
        <input name="trips_per_week" type="number" placeholder="One-way trips per week"
               required min={1} max={14} />{" "}
        <button type="submit">Add plan</button>
      </form>

      <h2>Your plans</h2>
      {loading && <p>Loading…</p>}
      {!loading && plans.length === 0 && <p>No plans yet. Add one above.</p>}
      <ul>
        {plans.map((p) => (
          <li key={p.id}>
            <button onClick={() => setSelectedId(p.id)}>
              {p.name}: {p.origin} to {p.destination}, {p.trips_per_week} trips a week
            </button>{" "}
            <button onClick={() => handleDelete(p.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {selected && comparison && (
        <section>
          <h2>{selected.name}</h2>
          <p>
            About {comparison.trips_per_month} one-way trips a month. Rank by:{" "}
            {(["cost", "time", "co2"] as Priority[]).map((p) => (
              <button key={p} onClick={() => setPriority(p)} disabled={priority === p}>
                {p}
              </button>
            ))}
          </p>

          {comparison.results.length === 0 && (
            <p>No options yet. Add a way to travel below.</p>
          )}
          <ol>
            {comparison.results.map((r) => (
              <li key={r.option_id}>
                <strong>{r.mode}</strong>: {r.monthly_cost} PLN,{" "}
                {Math.round(r.monthly_minutes / 60)} h, {r.monthly_co2_kg} kg CO2
                {r.uses_pass && " (monthly pass is cheaper)"}
                {r.break_even_trips !== null &&
                  ` – pass pays off from ${r.break_even_trips} trips a month`}{" "}
                <button onClick={() => handleDeleteOption(r.option_id)}>Remove</button>
              </li>
            ))}
          </ol>

          <form onSubmit={handleAddOption}>
            <h3>Add an option</h3>
            <select name="mode" defaultValue="train">
              <option value="train">train</option>
              <option value="bus">bus</option>
              <option value="carpool">carpool</option>
              <option value="car">car</option>
            </select>{" "}
            <input name="price_per_trip" type="number" placeholder="Price per trip (PLN)"
                   required min={0} step="any" />{" "}
            <input name="duration_min" type="number" placeholder="Minutes per trip"
                   required min={1} />{" "}
            <input name="monthly_pass_price" type="number" placeholder="Monthly pass (optional)"
                   min={0} step="any" />{" "}
            <input name="riders" type="number" placeholder="Riders (carpool)"
                   min={1} max={8} />{" "}
            <button type="submit">Add option</button>
          </form>

          <p>
            Prices and times are your own estimates, not live data. One trip means
            one one-way journey. For carpool, the price is the whole car's cost, split
            between the riders.
          </p>
        </section>
      )}
    </main>
  );
}