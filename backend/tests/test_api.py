from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import plan  # noqa: F401

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

PLAN = {"name": "Work", "origin": "Lodz", "destination": "Gdansk",
        "distance_km": 330, "trips_per_week": 3}
TRAIN = {"mode": "train", "price_per_trip": 80, "duration_min": 240,
         "monthly_pass_price": 300, "riders": 1}
BUS = {"mode": "bus", "price_per_trip": 45, "duration_min": 300, "riders": 1}


def setup_function():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)


def test_create_and_get_plan():
    created = client.post("/api/plans", json=PLAN)
    assert created.status_code == 201
    plan_id = created.json()["id"]
    assert client.get(f"/api/plans/{plan_id}").json()["origin"] == "Lodz"


def test_same_origin_and_destination_rejected():
    bad = {**PLAN, "destination": "lodz"}
    assert client.post("/api/plans", json=bad).status_code == 400


def test_missing_plan_returns_404():
    assert client.get("/api/plans/999").status_code == 404


def test_invalid_transport_mode_rejected():
    plan_id = client.post("/api/plans", json=PLAN).json()["id"]
    bad = {**TRAIN, "mode": "plane"}
    r = client.post(f"/api/plans/{plan_id}/options", json=bad)
    assert r.status_code == 422


def test_update_plan_changes_only_given_fields():
    plan_id = client.post("/api/plans", json=PLAN).json()["id"]
    r = client.put(f"/api/plans/{plan_id}", json={"trips_per_week": 5})
    assert r.status_code == 200
    assert r.json()["trips_per_week"] == 5
    assert r.json()["origin"] == "Lodz"


def test_comparison_ranks_cheapest_first():
    plan_id = client.post("/api/plans", json=PLAN).json()["id"]
    client.post(f"/api/plans/{plan_id}/options", json=BUS)
    client.post(f"/api/plans/{plan_id}/options", json=TRAIN)
    r = client.get(f"/api/plans/{plan_id}/comparison?priority=cost")
    data = r.json()
    assert [x["mode"] for x in data["results"]] == ["train", "bus"]
    assert data["best"]["uses_pass"] is True


def test_deleting_plan_removes_it():
    plan_id = client.post("/api/plans", json=PLAN).json()["id"]
    assert client.delete(f"/api/plans/{plan_id}").status_code == 204
    assert client.get(f"/api/plans/{plan_id}").status_code == 404
    

def test_advisor_respects_budget():
    plan_id = client.post("/api/plans", json=PLAN).json()["id"]
    client.post(f"/api/plans/{plan_id}/options", json=TRAIN)
    client.post(f"/api/plans/{plan_id}/options", json=BUS)
    r = client.post(
        f"/api/plans/{plan_id}/advice",
        json={"text": "I can spend 400 PLN a month and want the least CO2"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["understood"] == {"priority": "co2", "max_budget": 400.0}
    assert data["recommendation"]["mode"] == "train"    