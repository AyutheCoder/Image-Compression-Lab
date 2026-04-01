# Image Compression Tool (k-Means) - React Frontend

This setup keeps your original `model.py` unchanged and adds:

- A Flask API backend for interactive requests
- A React (Vite) frontend UI

## Project Structure

- `model.py` (your original script, unchanged)
- `api_server.py` (backend API for upload + compression)
- `backend_requirements.txt` (Python dependencies for API)
- `frontend/` (React app)

## Run Backend

1. Open terminal in project root.
2. Install dependencies:

```bash
pip install -r backend_requirements.txt
```

3. Start server:

```bash
python api_server.py
```

Backend runs on `http://localhost:5000`.

## Run Frontend

1. Open new terminal in `frontend` folder.
2. Install dependencies:

```bash
npm install
```

3. Start Vite dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` requests to backend.

## Features

- Upload JPG/PNG image
- Enter custom k values
- View MSE, inertia, compression ratio, compressed size
- Compare original vs compressed preview
- Download selected compressed image
- Elbow curve visualization
