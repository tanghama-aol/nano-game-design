[CmdletBinding()]
param(
  [switch]$ForceInstall,
  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$SkipDb,
  [switch]$NoDev,
  [switch]$Help
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

function Show-Usage {
  Write-Host @"
Nano Game Asset Generator runner

Usage:
  .\run.cmd
  .\run.cmd -SkipInstall
  .\run.cmd -SkipBuild -SkipDb
  .\run.cmd -NoDev

Options:
  -ForceInstall  Run pnpm install even when node_modules exists.
  -SkipInstall   Skip dependency installation checks.
  -SkipBuild     Skip workspace build before startup.
  -SkipDb        Skip Prisma db push before startup.
  -NoDev         Run setup steps only, then exit.
  -Help          Show this help text.
"@
}

function Write-Step {
  param([string]$Message)

  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  Write-Host "> $FilePath $($Arguments -join ' ')" -ForegroundColor DarkGray
  & $FilePath @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
  }
}

function Invoke-Pnpm {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  if ($script:PackageManagerCommand -eq "corepack") {
    Invoke-Checked $script:PackageManagerCommand (@("pnpm") + $Arguments)
  }
  else {
    Invoke-Checked $script:PackageManagerCommand $Arguments
  }
}

if ($Help) {
  Show-Usage
  exit 0
}

$Root = Split-Path -Parent $PSCommandPath
Set-Location $Root

Write-Host "Nano Game Asset Generator"
Write-Host "Workspace: $Root"

Write-Step "Checking runtime"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  throw "Node.js was not found. Install Node.js 20 or newer, then run this script again."
}

$nodeVersion = (& node --version).Trim()
Write-Host "Node: $nodeVersion"

$corepack = Get-Command corepack -ErrorAction SilentlyContinue
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue

if ($corepack) {
  $script:PackageManagerCommand = "corepack"
}
elseif ($pnpm) {
  $script:PackageManagerCommand = "pnpm"
}
else {
  throw "Neither Corepack nor pnpm was found. Install Node.js 20 or newer, or install pnpm."
}

$pnpmVersion = if ($script:PackageManagerCommand -eq "corepack") {
  (& corepack pnpm --version).Trim()
}
else {
  (& pnpm --version).Trim()
}

Write-Host "pnpm: $pnpmVersion"

if (-not $SkipInstall) {
  $lockFile = Join-Path $Root "pnpm-lock.yaml"
  $modulesFile = Join-Path $Root "node_modules\.modules.yaml"
  $needsInstall = $ForceInstall -or -not (Test-Path $modulesFile)

  if ((Test-Path $lockFile) -and (Test-Path $modulesFile)) {
    $lockChanged = (Get-Item $lockFile).LastWriteTimeUtc -gt (Get-Item $modulesFile).LastWriteTimeUtc
    $needsInstall = $needsInstall -or $lockChanged
  }

  if ($needsInstall) {
    Write-Step "Installing dependencies"
    Invoke-Pnpm install
  }
  else {
    Write-Step "Dependencies already installed"
    Write-Host "Use -ForceInstall to run pnpm install anyway."
  }
}
else {
  Write-Step "Skipping dependency installation"
}

if (-not $SkipBuild) {
  Write-Step "Building workspace"
  Invoke-Pnpm build
}
else {
  Write-Step "Skipping build"
}

if (-not $SkipDb) {
  Write-Step "Syncing database schema"
  Invoke-Pnpm db:push
}
else {
  Write-Step "Skipping database sync"
}

if ($NoDev) {
  Write-Step "Setup complete"
  exit 0
}

Write-Step "Starting development servers"
Write-Host "Frontend: http://localhost:5173"
Write-Host "API:      http://localhost:3001"
Write-Host "Press Ctrl+C to stop."
Invoke-Pnpm dev
