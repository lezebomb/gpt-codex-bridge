param(
  [string]$Version = "dev",
  [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if (-not $OutputDir) {
  $OutputDir = Join-Path $repoRoot "release"
}

$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)
$releaseRoot = Join-Path $repoRoot "bridge\output\release"
$stagingDir = Join-Path $releaseRoot "ChatGPTCodexBridge"
$zipName = "ChatGPTCodexBridge-$Version.zip"
$zipPath = Join-Path $OutputDir $zipName

function Assert-UnderPath {
  param(
    [string]$Child,
    [string]$Parent
  )
  $childFull = [System.IO.Path]::GetFullPath($Child)
  $parentFull = [System.IO.Path]::GetFullPath($Parent)
  if (-not $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to operate outside expected directory. Child=$childFull Parent=$parentFull"
  }
}

function Copy-ReleaseTree {
  param(
    [string]$Source,
    [string]$Destination
  )

  $excluded = @(
    ".git",
    "node_modules",
    "bridge\node_modules",
    "bridge\.npm-cache",
    "bridge\dist",
    "bridge\data",
    "bridge\output",
    "bridge\test-results",
    "bridge\playwright-report",
    "release"
  )

  $sourceRoot = (Resolve-Path $Source).Path
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null

  Get-ChildItem -LiteralPath $sourceRoot -Force -Recurse | ForEach-Object {
    $relative = $_.FullName.Substring($sourceRoot.Length).TrimStart("\")
    if (-not $relative) { return }

    $skipItem = $false
    foreach ($skip in $excluded) {
      if ($relative -eq $skip -or $relative.StartsWith("$skip\")) {
        $skipItem = $true
        break
      }
    }
    if ($skipItem) { return }

    $target = Join-Path $Destination $relative
    if ($_.PSIsContainer) {
      New-Item -ItemType Directory -Force -Path $target | Out-Null
    } else {
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
      Copy-Item -LiteralPath $_.FullName -Destination $target -Force
    }
  }
}

Assert-UnderPath -Child $releaseRoot -Parent (Join-Path $repoRoot "bridge\output")
if (Test-Path -LiteralPath $releaseRoot) {
  Remove-Item -LiteralPath $releaseRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Push-Location (Join-Path $repoRoot "bridge")
try {
  npm.cmd install --no-audit --no-fund --cache .\.npm-cache
  npm.cmd run build
} finally {
  Pop-Location
}

Copy-ReleaseTree -Source $repoRoot -Destination $stagingDir

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $stagingDir -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Release zip created:"
Write-Host $zipPath
Write-Host ""
Write-Host "Recommended GitHub install command for auto-updates:"
Write-Host "powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1 -SourceRepo `"https://github.com/lezebomb/gpt-codex-bridge.git`" -Branch `"main`""
