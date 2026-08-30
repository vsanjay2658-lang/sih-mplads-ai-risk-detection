"""
FastAPI Database & Supabase Integration Layer
"""
import os
import httpx
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "https://tewxomghwmsrfltxrquw.supabase.co")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld3hvbWdod21zcmZsdHhycXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjE5NzgsImV4cCI6MjA1NTczNzk3OH0.S69YwV1B3gOq4eA_Z9G-n-oR6cIeK4q6e4iA1u0c0")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

async def fetch_supabase_table(table: str, params: dict = None):
    """
    Asynchronously queries Supabase REST API via persistent httpx client.
    """
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, headers=HEADERS, params=params)
            if resp.status_code == 200:
                return resp.json()
            return []
        except Exception as e:
            print(f"Supabase query error on {table}: {e}")
            return []

async def insert_supabase_batch(table: str, rows: list):
    """
    Asynchronously inserts batch into Supabase REST API.
    """
    if not rows:
        return []
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.post(url, headers=HEADERS, json=rows)
            if resp.status_code in [200, 201]:
                return resp.json()
            print(f"Supabase insert failed with status {resp.status_code}: {resp.text}")
            return []
        except Exception as e:
            print(f"Supabase insert exception on {table}: {e}")
            return []
