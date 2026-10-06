# Final-Year Project Tracker

Starter implementation for the three-member MVP split:

- `frontend/`: React + Tailwind login screen and Axios JWT interceptor.
- `backend/`: Express + PostgreSQL connection and JWT login API.

## Run the backend

```bash
cd backend
cp .env.example .env
npm install
# Create the database, then run schema.sql against it.
npm run dev
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:5000/api` by default. Set `VITE_API_URL` to override it.
