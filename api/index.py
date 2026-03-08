"""Vercel Serverless Entry Point

This file serves as the entry point for Vercel serverless deployment.
It imports and exposes the FastAPI app from the backend directory.
"""
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app from backend/server.py
from server import app

# Vercel expects the ASGI app to be named 'app'
# The app is already configured with all routes, middleware, and database connections
app = app
