from dataclasses import dataclass

WEEKS_PER_MONTH = 52 / 12
CO2_KG_PER_KM = {"car": 0.17, "carpool": 0.17, "bus": 0.09, "train": 0.03}


@dataclass
class OptionResult:
    mode: str
    monthly_cost: float
    monthly_minutes: float
    monthly_co2_kg: float
    uses_pass: bool


def compare_option(mode, price_per_trip, duration_min, distance_km,
                   trips_per_week, monthly_pass_price=None, riders=1):
    trips = trips_per_week * WEEKS_PER_MONTH
    share = riders if mode == "carpool" else 1
    single_total = (price_per_trip / share) * trips
    uses_pass = monthly_pass_price is not None and monthly_pass_price < single_total
    cost = monthly_pass_price if uses_pass else single_total
    minutes = duration_min * trips
    co2 = CO2_KG_PER_KM[mode] * distance_km * trips / share
    return OptionResult(mode, round(cost, 2), round(minutes, 1), round(co2, 1), uses_pass)
