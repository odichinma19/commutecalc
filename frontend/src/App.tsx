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

export default function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
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

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>CommuteCalc</h1>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>Could not load plans: {error}</p>}
      {!loading && !error && plans.length === 0 && <p>No plans yet.</p>}
      <ul>
        {plans.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong>: {p.origin} to {p.destination},{" "}
            {p.trips_per_week} trips a week, {p.options.length} options
          </li>
        ))}
      </ul>
    </main>
  );
}