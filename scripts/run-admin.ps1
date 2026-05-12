$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"

if (-not (Test-Path $backendDir)) {
  throw "Backend directory not found: $backendDir"
}

$pythonCandidates = @(
  (Join-Path $backendDir ".venv\Scripts\python.exe"),
  (Join-Path $projectRoot ".venv\Scripts\python.exe"),
  "python"
)

$pythonCmd = $null
foreach ($candidate in $pythonCandidates) {
  if ($candidate -eq "python") {
    if (Get-Command python -ErrorAction SilentlyContinue) {
      $pythonCmd = "python"
      break
    }
  }
  elseif (Test-Path $candidate) {
    $pythonCmd = $candidate
    break
  }
}

if (-not $pythonCmd) {
  throw "Python not found. Create a venv first or install Python."
}

Write-Host "Installing/updating backend dependencies..."
& $pythonCmd -m pip install -r (Join-Path $backendDir "requirements.txt")

$backendArgs = @(
  "-m", "uvicorn", "main:app",
  "--host", "0.0.0.0",
  "--port", "8000",
  "--reload"
)

$backend = Start-Process `
  -FilePath $pythonCmd `
  -ArgumentList $backendArgs `
  -WorkingDirectory $backendDir `
  -WindowStyle Hidden `
  -PassThru

Write-Host ""
Write-Host "Backend started on http://localhost:8000 (PID: $($backend.Id))"
Write-Host "Starting frontend..."
Write-Host "Admin panel URL: http://localhost:5173/super-admin/login"
Write-Host ""

try {
  Set-Location $projectRoot
  npm run dev -- --host 0.0.0.0 --port 5173
}
finally {
  if ($backend -and -not $backend.HasExited) {
    Stop-Process -Id $backend.Id -Force
    Write-Host ""
    Write-Host "Backend stopped."
  }
}
