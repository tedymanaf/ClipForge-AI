from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

backend_path = Path(__file__).with_name("app.py")
spec = spec_from_file_location("clipforge_fastapi_app", backend_path)

if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load FastAPI backend module from app.py")

module = module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app
