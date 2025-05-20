# make.ps1

Write-Host "Cleaning..."
npm run clean

Write-Host "Packing with Forge..."
cross-env NODE_ENV=production electron-forge package

Write-Host "Waiting for filesystem to flush..."
Start-Sleep -Seconds 3

Write-Host "Checking output structure..."
if (Test-Path ".webpack/x64/main/index.js") {
    Write-Host "Main entry point exists"
} else {
    Write-Host "Error: Main entry point .webpack/x64/main/index.js not found"
    exit 1
}

Write-Host "Building with electron-builder..."
electron-builder
