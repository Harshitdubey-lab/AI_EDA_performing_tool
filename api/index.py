import sys
import os

# Add root and backend to python path for serverless imports
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backend.main import app
