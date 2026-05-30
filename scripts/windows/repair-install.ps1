param(
  [switch]$RemoveLock
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$bridgeDir = Join-Path $repoRoot "bridge"

if (-not (Test-Path -LiteralPath (Join-Path $bridgeDir "package.json"))) {
  throw "Could not find bridge/package.json under $repoRoot"
}

$workspaceCache = Join-Path $bridgeDir ".npm-cache"
Write-Host "Cleaning npm cache..."
npm.cmd cache clean --force --cache $workspaceCache

$pathsToRemove = @(
  (Join-Path $repoRoot "node_modules"),
  (Join-Path $bridgeDir "node_modules")
)

foreach ($target in $pathsToRemove) {
  if (Test-Path -LiteralPath $target) {
    Write-Host "Removing $target"
    Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
  }
}

if ($RemoveLock) {
  $locks = @(
    (Join-Path $repoRoot "package-lock.json"),
    (Join-Path $bridgeDir "package-lock.json")
  )
  foreach ($lock in $locks) {
    if (Test-Path -LiteralPath $lock) {
      Write-Host "Removing $lock"
      Remove-Item -LiteralPath $lock -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host "Installing bridge dependencies..."
Push-Location $bridgeDir
New-Item -ItemType Directory -Force -Path $workspaceCache | Out-Null
npm.cmd install --no-audit --no-fund --cache $workspaceCache
Pop-Location

Write-Host ""
Write-Host "Repair install complete. Start Bridge from the repository root with:"
Write-Host "npm.cmd run dev"
