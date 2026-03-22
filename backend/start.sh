#!/bin/bash
# Seed the database (creates tables + inserts products/admin if not present)
python seed.py

# Start the FastAPI server
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
