import type { Comparison, NewPlan, Plan, Priority } from "./types";

const API = "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `Server error ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail))
        message = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } catch {
      /* keep the default message */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const getPlans = () => request<Plan[]>("/api/plans");

export const createPlan = (data: NewPlan) =>
  request<Plan>("/api/plans", { method: "POST", body: JSON.stringify(data) });

export const deletePlan = (id: number) =>
  request<void>(`/api/plans/${id}`, { method: "DELETE" });

export const getComparison = (id: number, priority: Priority) =>
  request<Comparison>(`/api/plans/${id}/comparison?priority=${priority}`);