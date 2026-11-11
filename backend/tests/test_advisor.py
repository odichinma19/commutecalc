from types import SimpleNamespace

from app.services.advisor import Preferences, advise, parse_request

PLAN = SimpleNamespace(distance_km=330, trips_per_week=3)
TRAIN = SimpleNamespace(id=1, mode="train", price_per_trip=80, duration_min=240,
                        monthly_pass_price=300, riders=1)
BUS = SimpleNamespace(id=2, mode="bus", price_per_trip=45, duration_min=300,
                      monthly_pass_price=None, riders=1)


def test_parse_co2_and_budget():
    text = "I commute 3 days a week and can spend 600 PLN, I want the least CO2"
    assert parse_request(text) == Preferences("co2", 600.0)


def test_parse_defaults_to_cost():
    assert parse_request("Cheapest please") == Preferences("cost", None)


def test_parse_time():
    assert parse_request("I'm in a hurry, fastest option").priority == "time"


def test_parse_zloty_sign():
    assert parse_request("max 450 zł").max_budget == 450.0


def test_budget_filters_options():
    advice = advise(PLAN, [TRAIN, BUS], Preferences("cost", 400))
    assert advice.option.id == 1
    assert "train" in advice.explanation


def test_nothing_fits_budget():
    advice = advise(PLAN, [TRAIN, BUS], Preferences("cost", 100))
    assert advice.option is None
    assert "cheapest" in advice.explanation


def test_time_priority_picks_faster_option():
    advice = advise(PLAN, [TRAIN, BUS], Preferences("time", None))
    assert advice.option.id == 1


def test_no_options_yet():
    assert advise(PLAN, [], Preferences()).option is None