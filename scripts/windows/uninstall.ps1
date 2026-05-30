param(
  [string]$InstallDir = "$env:LOCALAPPDATA\ChatGPTCodexBridge",
  [switch]$RemoveFiles
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$programsDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\ChatGPT Codex Bridge"
$configDir = Join-Path $env:APPDATA "ChatGPTCodexBridge"
$desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "ChatGPT Codex Bridge Dashboard.url"

if (Test-Path -LiteralPath $programsDir) {
  Remove-Item -LiteralPath $programsDir -Recurse -Force
}

if (Test-Path -LiteralPath $desktopShortcut) {
  Remove-Item -LiteralPath $desktopShortcut -Force
}

if (Test-Path -LiteralPath $configDir) {
  Remove-Item -LiteralPath $configDir -Recurse -Force
}

if ($RemoveFiles) {
  $resolved = [System.IO.Path]::GetFullPath($InstallDir)
  $localAppData = [System.IO.Path]::GetFullPath($env:LOCALAPPDATA)
  if (-not $resolved.StartsWith($localAppData, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove files outside LOCALAPPDATA: $resolved"
  }
  if (Test-Path -LiteralPath $resolved) {
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
}

Write-Host "ChatGPT Codex Bridge shortcuts and config removed."
if (-not $RemoveFiles) {
  Write-Host "Install files were kept at: $InstallDir"
  Write-Host "Run with -RemoveFiles to remove the install directory."
}
