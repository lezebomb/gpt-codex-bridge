param(
  [string]$InstallDir = "$env:LOCALAPPDATA\ChatGPTCodexBridge",
  [string]$ConfigPath = "$env:APPDATA\ChatGPTCodexBridge\bridge-env.ps1",
  [switch]$NoBrowser,
  [switch]$Foreground,
  [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$InstallDir = [System.IO.Path]::GetFullPath($InstallDir)
$bridgeDir = Join-Path $InstallDir "bridge"

if (-not (Test-Path -LiteralPath $bridgeDir)) {
  $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
  $repoBridgeDir = Join-Path $repoRoot "bridge"
  if (Test-Path -LiteralPath $repoBridgeDir) {
    $bridgeDir = $repoBridgeDir
  } else {
    throw "Bridge directory not found. InstallDir=$InstallDir"
  }
}

if (Test-Path -LiteralPath $ConfigPath) {
  . $ConfigPath
} else {
  if (-not $env:BRIDGE_PORT) { $env:BRIDGE_PORT = "8787" }
}

if (-not $env:BRIDGE_PORT) { $env:BRIDGE_PORT = "8787" }

$dashboardUrl = "http://localhost:$($env:BRIDGE_PORT)/dashboard/"
$bootstrapUrl = "http://127.0.0.1:$($env:BRIDGE_PORT)/bootstrap"

function Test-BridgeReady {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri $bootstrapUrl -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

Write-Host "Starting ChatGPT Codex Bridge..."
Write-Host "Bridge dir: $bridgeDir"
Write-Host "Dashboard: $dashboardUrl"
Write-Host "Token, execution mode, and access mode are managed in Dashboard > Settings."
Write-Host ""

if (Test-BridgeReady) {
  Write-Host "Bridge is already running."
  if (-not $NoBrowser) {
    Start-Process $dashboardUrl | Out-Null
  }
  return
}

Push-Location $bridgeDir
try {
  $npm = (Get-Command npm.cmd -ErrorAction Stop).Source

  if (-not (Test-Path -LiteralPath (Join-Path $bridgeDir "node_modules"))) {
    Write-Host "Installing dependencies because node_modules is missing..."
    & $npm install --no-audit --no-fund
  }

  if ($Foreground) {
    if (-not $NoBrowser) {
      Write-Host "Foreground mode starts the server in this window. Open the dashboard after the server prints its URL:"
      Write-Host $dashboardUrl
    }
    & $npm run dev
    return
  }

  $logDir = Join-Path $bridgeDir "data\logs"
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $stdoutPath = Join-Path $logDir "startup-$stamp.out.log"
  $stderrPath = Join-Path $logDir "startup-$stamp.err.log"

  $process = Start-Process `
    -FilePath $npm `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory $bridgeDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru

  Write-Host "Bridge service started in the background. PID: $($process.Id)"
  Write-Host "Startup logs:"
  Write-Host "  $stdoutPath"
  Write-Host "  $stderrPath"

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-BridgeReady) {
      Write-Host "Bridge is ready."
      if (-not $NoBrowser) {
        Start-Process $dashboardUrl | Out-Null
      }
      return
    }
    Start-Sleep -Milliseconds 700
  }

  Write-Host "Bridge did not become ready within $TimeoutSeconds seconds."
  Write-Host "Check the startup logs above, or run this for an interactive log window:"
  Write-Host "powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Foreground"
} finally {
  Pop-Location
}
