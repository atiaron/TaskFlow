# TaskFlow (AI/Server Only)

This repository has been pruned to keep only AI, backend, and shared services code. All UI/UX, React, and frontend build tooling were removed per request.

What remains:

- server/ (Express backend, auth bridge, Firebase Admin)
- src/services, src/utils, src/types (AI/business logic and shared services)

How to run the backend locally (Windows cmd):

- Install dependencies at root: npm install
- Start backend in dev mode: npm run dev:be
- Health check: http://localhost:3333/health

Notes:

- Frontend scripts are no-ops now. Use server package.json to manage backend directly if preferred.
- TypeScript is limited to services/utils/types only (see tsconfig.json).
