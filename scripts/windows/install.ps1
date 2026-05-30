param(
  [string]$InstallDir = "$env:LOCALAPPDATA\ChatGPTCodexBridge",
  [string]$SourceRepo = "",
  [string]$Branch = "main",
  [string]$Port = "8787",
  [string]$Token = "",
  [ValidateSet("read_only", "manual_review", "auto_review", "full_access")]
  [string]$PermissionMode = "manual_review",
  [ValidateSet("dry-run", "cli", "app-server")]
  [string]$Execution = "dry-run",
  [switch]$NoDesktopShortcut
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

function Copy-ProjectTree {
  param(
    [string]$Source,
    [string]$Destination
  )

  $excludedDirs = @(
    ".git",
    "node_modules",
    "bridge\node_modules",
    "bridge\dist",
    "bridge\data\logs",
    "bridge\test-results",
    "bridge\output"
  )

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  $sourceRoot = (Resolve-Path $Source).Path

  Get-ChildItem -LiteralPath $sourceRoot -Force -Recurse | ForEach-Object {
    $relative = $_.FullName.Substring($sourceRoot.Length).TrimStart("\")
    $skip = $false
    foreach ($excluded in $excludedDirs) {
      if ($relative -eq $excluded -or $relative.StartsWith("$excluded\")) {
        $skip = $true
        break
      }
    }
    if (-not $skip) {
      $target = Join-Path $Destination $relative
      if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Force -Path $target | Out-Null
      } else {
        $targetDir = Split-Path -Parent $target
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        Copy-Item -LiteralPath $_.FullName -Destination $target -Force
      }
    }
  }
}

function New-Link {
  param(
    [string]$Path,
    [string]$TargetPath,
    [string]$Arguments = "",
    [string]$WorkingDirectory = ""
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($Path)
  $shortcut.TargetPath = $TargetPath
  $shortcut.Arguments = $Arguments
  if ($WorkingDirectory) {
    $shortcut.WorkingDirectory = $WorkingDirectory
  }
  $shortcut.Save()
}

if (-not $Token) {
  $Token = [Guid]::NewGuid().ToString("N")
}

$InstallDir = [System.IO.Path]::GetFullPath($InstallDir)
$configDir = Join-Path $env:APPDATA "ChatGPTCodexBridge"
$configPath = Join-Path $configDir "bridge-env.ps1"
$manifestPath = Join-Path $configDir "install.json"

New-Item -ItemType Directory -Force -Path $configDir | Out-Null

if ($SourceRepo) {
  if (Test-Path -LiteralPath $InstallDir) {
    if (Test-Path -LiteralPath (Join-Path $InstallDir ".git")) {
      Push-Location $InstallDir
      git fetch origin $Branch
      git checkout $Branch
      git pull --ff-only origin $Branch
      Pop-Location
    } else {
      throw "InstallDir already exists and is not a Git checkout: $InstallDir"
    }
  } else {
    git clone --branch $Branch $SourceRepo $InstallDir
  }
} else {
  $repoRoot = Get-RepoRoot
  Copy-ProjectTree -Source $repoRoot -Destination $InstallDir
}

$bridgeDir = Join-Path $InstallDir "bridge"
if (-not (Test-Path -LiteralPath (Join-Path $bridgeDir "package.json"))) {
  throw "Could not find bridge/package.json under $InstallDir"
}

Push-Location $bridgeDir
npm.cmd install --no-audit --no-fund
npm.cmd run build
Pop-Location

@"
`$env:BRIDGE_PORT = "$Port"
"@ | Set-Content -LiteralPath $configPath -Encoding UTF8

$runtimeDir = Join-Path $bridgeDir "data"
$runtimePath = Join-Path $runtimeDir "runtime.json"
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
if (-not (Test-Path -LiteralPath $runtimePath)) {
  [ordered]@{
    token = $Token
    execution = $Execution
    updatedAt = (Get-Date).ToString("o")
  } | ConvertTo-Json | Set-Content -LiteralPath $runtimePath -Encoding UTF8
}

$manifest = [ordered]@{
  installDir = $InstallDir
  sourceRepo = $SourceRepo
  branch = $Branch
  configPath = $configPath
  dashboardUrl = "http://localhost:$Port/dashboard/"
  installedAt = (Get-Date).ToString("o")
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$programsDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\ChatGPT Codex Bridge"
New-Item -ItemType Directory -Force -Path $programsDir | Out-Null

$powershell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$startScript = Join-Path $InstallDir "scripts\windows\start-bridge.ps1"
$updateScript = Join-Path $InstallDir "scripts\windows\update.ps1"

New-Link `
  -Path (Join-Path $programsDir "Start ChatGPT Codex Bridge.lnk") `
  -TargetPath $powershell `
  -Arguments "-NoExit -ExecutionPolicy Bypass -File `"$startScript`"" `
  -WorkingDirectory $InstallDir

New-Link `
  -Path (Join-Path $programsDir "Update ChatGPT Codex Bridge.lnk") `
  -TargetPath $powershell `
  -Arguments "-NoExit -ExecutionPolicy Bypass -File `"$updateScript`"" `
  -WorkingDirectory $InstallDir

$urlFile = Join-Path $programsDir "Open Dashboard.url"
@"
[InternetShortcut]
URL=http://localhost:$Port/dashboard/
"@ | Set-Content -LiteralPath $urlFile -Encoding ASCII

if (-not $NoDesktopShortcut) {
  $desktop = [Environment]::GetFolderPath("Desktop")
  Copy-Item -LiteralPath $urlFile -Destination (Join-Path $desktop "ChatGPT Codex Bridge Dashboard.url") -Force
}

Write-Host ""
Write-Host "ChatGPT Codex Bridge installed."
Write-Host "Install dir: $InstallDir"
Write-Host "Config: $configPath"
Write-Host "Dashboard: http://localhost:$Port/dashboard/"
Write-Host "Token, execution mode, and access mode are managed in Dashboard > Settings."
Write-Host ""
Write-Host "Use the Start Menu shortcut: Start ChatGPT Codex Bridge"
