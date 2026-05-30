param(
  [string]$InstallDir = "",
  [string]$Branch = "",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$manifestPath = Join-Path $env:APPDATA "ChatGPTCodexBridge\install.json"

if (-not $InstallDir) {
  if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $InstallDir = [string]$manifest.installDir
    if (-not $Branch -and $manifest.branch) {
      $Branch = [string]$manifest.branch
    }
  } else {
    $InstallDir = "$env:LOCALAPPDATA\ChatGPTCodexBridge"
  }
}

if (-not $Branch) {
  $Branch = "main"
}

$InstallDir = [System.IO.Path]::GetFullPath($InstallDir)
$bridgeDir = Join-Path $InstallDir "bridge"

if (-not (Test-Path -LiteralPath $InstallDir)) {
  throw "InstallDir not found: $InstallDir"
}

if (Test-Path -LiteralPath (Join-Path $InstallDir ".git")) {
  Push-Location $InstallDir
  git fetch origin $Branch
  git checkout $Branch
  git pull --ff-only origin $Branch
  Pop-Location
} else {
  throw "This install is not a Git checkout. Re-run scripts\windows\install.ps1 from an updated local repo, or install with -SourceRepo after publishing to GitHub."
}

if (-not (Test-Path -LiteralPath (Join-Path $bridgeDir "package.json"))) {
  throw "Could not find bridge/package.json under $InstallDir"
}

Push-Location $bridgeDir
$npmCache = Join-Path $bridgeDir ".npm-cache"
New-Item -ItemType Directory -Force -Path $npmCache | Out-Null
npm.cmd install --no-audit --no-fund --cache $npmCache
if (-not $SkipBuild) {
  npm.cmd run build
}
Pop-Location

Write-Host ""
Write-Host "ChatGPT Codex Bridge updated."
Write-Host "Install dir: $InstallDir"
Write-Host "Start it from the Start Menu shortcut or run:"
Write-Host "powershell -ExecutionPolicy Bypass -File `"$InstallDir\scripts\windows\start-bridge.ps1`""
