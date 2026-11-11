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
- Prompts with a budget nothing fits get a clear message and the cheapest option.

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
- CO₂ factors per passenger-km are rough averages (car and carpool 0.17, bus 0.09,
  train 0.03 kg). Source: [ADD THE SOURCE YOU CHECKED].
- No user accounts: all plans are shared in one local database.

## How I used AI
[WRITE THIS YOURSELF, HONESTLY. Suggested starting point: I used ChatGPT to draft the
first project idea and structure, and Claude as a step-by-step tutor that proposed code,
which I typed in or pasted, ran and debugged. I wrote and ran the tests, fixed errors as
they came up, and can explain each part of the code. The AI advisor feature is rule-based
and does not call an AI model.]

## Possible next steps
- Optional LLM step to understand more phrasings and word the explanation, falling back to
  the rules when no API key is set.
- Real timetable and price data, and user accounts.

## Credits
Background photo from Pexels: [PHOTOGRAPHER'S NAME].