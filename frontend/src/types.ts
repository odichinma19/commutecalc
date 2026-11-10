export type Priority = "cost" | "time" | "co2";

export type Option = {
  id: number;
  mode: string;
  price_per_trip: number;
  duration_min: number;
  monthly_pass_price: number | null;
  riders: number;
};

export type Plan = {
  id: number;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  trips_per_week: number;
  options: Option[];
};

export type NewPlan = Omit<Plan, "id" | "options">;

export type NewOption = Omit<Option, "id">;

export type Item = {
  rank: number;
  option_id: number;
  mode: string;
  monthly_cost: number;
  monthly_minutes: number;
  monthly_co2_kg: number;
  uses_pass: boolean;
  break_even_trips: number | null;
};

export type Comparison = {
  trips_per_month: number;
  priority: string;
  results: Item[];
  best: Item | null;
};