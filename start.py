import os
import sys
from pathlib import Path
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    backend_path = Path(__file__).resolve().parent / "backend"
    if str(backend_path) not in sys.path:
        sys.path.insert(0, str(backend_path))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
