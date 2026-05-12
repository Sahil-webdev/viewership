$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$backendVenvPython = Join-Path $backendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $backendDir)) {
  throw "Backend directory not found: $backendDir"
}

if (-not (Test-Path $backendVenvPython)) {
  Write-Host "Creating backend virtual environment..."
  if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python not found. Install Python first: https://www.python.org/downloads/"
  }
  python -m venv (Join-Path $backendDir ".venv")
}

if (-not (Test-Path $backendVenvPython)) {
  throw "Backend venv python not found at: $backendVenvPython"
}

Write-Host "Installing/updating backend dependencies..."
& $backendVenvPython -m pip install -r (Join-Path $backendDir "requirements.txt")

Write-Host ""
Write-Host "Starting backend on http://localhost:8000 ..."
Write-Host "Press Ctrl+C to stop."
Write-Host ""

Set-Location $backendDir
& $backendVenvPython -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
