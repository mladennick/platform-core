# Run from parent folder (Documenti\SW) after closing Cursor/terminals that lock BE:
#   powershell -File .\BE\scripts\rename-root-to-platform-core.ps1

$ErrorActionPreference = "Stop"
$parent = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
# Prefer running when script lives in BE\scripts
$sw = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $sw

if (Test-Path ".\platform-core") {
    Write-Host "platform-core already exists."
    exit 0
}
if (-not (Test-Path ".\BE")) {
    Write-Host "BE folder not found in $sw"
    exit 1
}

Rename-Item -Path ".\BE" -NewName "platform-core"
Write-Host "Renamed BE -> platform-core"
Get-ChildItem ".\platform-core" | Select-Object Name
