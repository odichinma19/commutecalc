# CommuteCalc

A small full-stack app that compares train, bus, carpool and car for a long-distance
commute (for example Łódź to Gdańsk) over a month: cost, travel time and CO₂.

**Demo video:** [demo.mp4](demo.mp4)

## What it does
- Create commute plans: from, to, distance and one-way trips per week.
- Add travel options to a plan, each with a price per trip, duration, an optional monthly
  pass and, for carpool, the number of riders.
- See the options ranked by cost, time or CO₂.
- Ask the advisor in plain words, for example "I can spend 600 PLN a month and want the
  least CO2".

## Creative twist: break-even insight
If an option has a monthly pass, the app compares it with single tickets at your number of
trips. It uses whichever is cheaper and tells you from how many trips a month the pass pays
off (for example "from 3.8 trips a month").

## The advisor
The text box reads a sentence and picks a priority (cost, time or CO₂) and an optional
monthly budget in PLN. It then ranks your own options with the same tested calculation
function and explains the result.

- It is **rule-based, not an AI model**. The response says `answered by rules`.
- It never invents numbers: every figure comes from the options you entered.
- It understands a number followed by PLN or zł, or phrases like "max 400", plus a few
  keywords for cost, time and CO₂. If it can't read a priority, it defaults to cost.
- If nothing fits the budget, it says so and names the cheapest option.

## Tech
- **Back end:** Python, FastAPI, SQLAlchemy, SQLite, Pydantic, pytest
- **Front end:** React, TypeScript, Vite
- REST API with full CRUD, validation (422), 400 and 404 errors, and CORS for the Vite dev
  server
- The calculation is a pure function with unit tests, separate from the API layer

## Project structure
```
backend/
  app/api        routes: plans, options, comparison, advisor
  app/models     database tables
  app/schemas    request and response validation
  app/services   calculation and advisor logic
  tests          pytest tests (19)
frontend/
  src            App.tsx, api.ts, types.ts, styles
```

## API overview
| Method | Path | Purpose |
|---|---|---|
| GET, POST | /api/plans | list or create plans |
| GET, PUT, DELETE | /api/plans/{id} | read, update or delete a plan |
| POST | /api/plans/{id}/options | add an option |
| PUT, DELETE | /api/plans/{id}/options/{option_id} | update or delete an option |
| GET | /api/plans/{id}/comparison?priority=cost\|time\|co2 | ranked comparison |
| POST | /api/plans/{id}/advice | advisor answer for a sentence |

Interactive docs: http://127.0.0.1:8000/docs

## Run locally (Windows)
Back end:
```
cd backend
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Front end (second terminal):
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The SQLite file is created automatically on first run.

Tests (from the `backend` folder): `python -m pytest`

## Assumptions and limits
- One trip means one one-way journey.
- Prices and times are estimates entered by the user, not live data.
- For carpool, the price is the whole car's cost, split between the riders.
- CO₂ factors (kg CO₂e): national rail 0.03546 and coach 0.02776 per passenger-km, car and
  carpool 0.17 per vehicle-km (divided by the riders for carpool). Source: UK Government
  GHG Conversion Factors for Company Reporting 2025 (DESNZ/DEFRA), "Business travel – land".
  "Bus" in this app means an intercity coach.
- These are UK averages, not Polish ones. Poland's electricity mix is more carbon-intensive,
  so the real train figure is probably higher.
- No user accounts: all plans are shared in one local database.

## How I used AI
I used ChatGPT to explore ideas and an early project structure, and chose a different idea.
I then used Claude as a step-by-step coding assistant: it proposed the architecture and most
of the code, and I typed or pasted each file, ran it, fixed the errors that came up (wrong
folders, file names, data entry mistakes) and ran the tests. I checked the CO₂ factors
against the UK government's published data. The advisor is rule-based and does not call an
AI model.

## Possible next steps
- Optional LLM step to understand more phrasings and word the explanation, falling back to
  the rules when no API key is set.
- Real timetable and price data, and user accounts.

## Credits
Background photo: "W 8 Street" subway platform, via Pixabay (uploader: Pexels), Pixabay
Content License.