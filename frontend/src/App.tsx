import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

type Option = {
  id: number;
  mode: string;
  price_per_trip: number;
  duration_min: number;
  monthly_pass_price: number | null;
  riders: number;
};

type Plan = {
  id: number;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  trips_per_week: number;
  options: Option[];
};

type Item = {
  rank: number;
  option_id: number;
  mode: string;
  monthly_cost: number;
  monthly_minutes: number;
  monthly_co2_kg: number;
  uses_pass: boolean;
  break_even_trips: number | null;
};

type Comparison = {
  trips_per_month: number;
  priority: string;
  results: Item[];
  best: Item | null;
};

type Priority = "cost" | "time" | "co2";

export default function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [priority, setPriority] = useState<Priority>("cost");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/plans`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then(setPlans)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`${API}/api/plans/${selected.id}/comparison?priority=${priority}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then(setComparison)
      .catch((e) => setError(e.message));
  }, [selected, priority]);

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>CommuteCalc</h1>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>Something went wrong: {error}</p>}
      {!loading && !error && plans.length === 0 && <p>No plans yet.</p>}

      <ul>
        {plans.map((p) => (
          <li key={p.id}>
            <button onClick={() => setSelected(p)}>
              {p.name}: {p.origin} to {p.destination}, {p.trips_per_week} trips a week
            </button>
          </li>
        ))}
      </ul>

      {selected && comparison && (
        <section>
          <h2>{selected.name}</h2>
          <p>
            About {comparison.trips_per_month} one-way trips a month. Rank by:{" "}
            {(["cost", "time", "co2"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                disabled={priority === p}
              >
                {p}
              </button>
            ))}
          </p>
          <ol>
            {comparison.results.map((r) => (
              <li key={r.option_id}>
                <strong>{r.mode}</strong>: {r.monthly_cost} PLN, {Math.round(r.monthly_minutes / 60)} h,{" "}
                {r.monthly_co2_kg} kg CO2
                {r.uses_pass && " (monthly pass is cheaper)"}
                {r.break_even_trips !== null &&
                  ` – pass pays off from ${r.break_even_trips} trips a month`}
              </li>
            ))}
          </ol>
          <p>
            Prices and times are your own estimates, not live data. One trip means one
            one-way journey.
          </p>
        </section>
      )}
    </main>
  );
}