from fastapi import FastAPI


app = FastAPI(title="Teacher Workflow Automation API")


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Teacher Workflow Automation API is running"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}