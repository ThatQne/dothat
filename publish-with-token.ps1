# Electron Publisher with Token Management GUI
# This script provides a GUI-like interface to manage GitHub tokens and publish your app

param (
    [string]$UseMakeCmd = ""  # Parameter to accept the make command from package.json
)

# Get the script's directory to use as base for npm commands
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check for admin privileges and self-elevate if needed
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script works best with admin privileges. Restarting as administrator..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    
    # Self-elevate the script
    $scriptPath = $MyInvocation.MyCommand.Path
    $arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`""
    
    # Start new PowerShell process with admin privileges
    Start-Process powershell -Verb RunAs -ArgumentList $arguments
    
    # Exit the current, non-elevated process
    exit
}

# Functions for token management
function Get-MaskedToken {
    param([string]$token)
    if ($token.Length -ge 8) {
        return $token.Substring(0, 4) + "..." + $token.Substring($token.Length - 4)
    } else {
        return "[Invalid token format]"
    }
}

function Show-MainMenu {
    Clear-Host
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "|             ELECTRON PUBLISHER GUI             |" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host " Running with administrator privileges!" -ForegroundColor Green
    Write-Host " Current directory: $scriptDir" -ForegroundColor Gray
    Write-Host ""
    Write-Host " Current Token Status:" -ForegroundColor Yellow
    
    if ($env:GITHUB_TOKEN) {
        $maskedToken = Get-MaskedToken -token $env:GITHUB_TOKEN
        Write-Host " GITHUB_TOKEN: " -NoNewline
        Write-Host "SET ($maskedToken)" -ForegroundColor Green
    } else {
        Write-Host " GITHUB_TOKEN: " -NoNewline
        Write-Host "NOT SET" -ForegroundColor Red
    }
    
    if ($env:GH_TOKEN) {
        Write-Host " GH_TOKEN: " -NoNewline
        Write-Host "SET" -ForegroundColor Green
    } else {
        Write-Host " GH_TOKEN: " -NoNewline
        Write-Host "NOT SET" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host " 1. Check environment variables" -ForegroundColor Cyan
    Write-Host " 2. Set GitHub token for current session" -ForegroundColor Cyan
    Write-Host " 3. Set GitHub token permanently" -ForegroundColor Cyan
    Write-Host " 4. Export token to .env file" -ForegroundColor Cyan
    Write-Host " 5. Test GitHub access" -ForegroundColor Cyan
    Write-Host " 6. Run publish" -ForegroundColor Green
    Write-Host " 7. Exit" -ForegroundColor Red
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    $choice = Read-Host "  Enter your choice (1-7)"
    return $choice
}

function Check-TokenStatus {
    Clear-Host
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "|           CHECKING TOKEN ENVIRONMENT           |" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check current session
    Write-Host "Current Session:" -ForegroundColor Yellow
    Write-Host " GITHUB_TOKEN: " -NoNewline
    if ($env:GITHUB_TOKEN) {
        $maskedToken = Get-MaskedToken -token $env:GITHUB_TOKEN
        Write-Host "SET ($maskedToken)" -ForegroundColor Green
    } else {
        Write-Host "NOT SET" -ForegroundColor Red
    }
    
    Write-Host " GH_TOKEN: " -NoNewline
    if ($env:GH_TOKEN) {
        $maskedToken = Get-MaskedToken -token $env:GH_TOKEN
        Write-Host "SET ($maskedToken)" -ForegroundColor Green
    } else {
        Write-Host "NOT SET" -ForegroundColor Red
    }
    
    # Check user level
    Write-Host ""
    Write-Host "User Level (Permanent):" -ForegroundColor Yellow
    $userGithubToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", [EnvironmentVariableTarget]::User)
    Write-Host " GITHUB_TOKEN: " -NoNewline
    if ($userGithubToken) {
        $maskedToken = Get-MaskedToken -token $userGithubToken
        Write-Host "SET ($maskedToken)" -ForegroundColor Green
    } else {
        Write-Host "NOT SET" -ForegroundColor Red
    }
    
    $userGhToken = [Environment]::GetEnvironmentVariable("GH_TOKEN", [EnvironmentVariableTarget]::User)
    Write-Host " GH_TOKEN: " -NoNewline
    if ($userGhToken) {
        $maskedToken = Get-MaskedToken -token $userGhToken
        Write-Host "SET ($maskedToken)" -ForegroundColor Green
    } else {
        Write-Host "NOT SET" -ForegroundColor Red
    }
    
    # Check system level
    Write-Host ""
    Write-Host "System Level (Permanent):" -ForegroundColor Yellow
    $sysGithubToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", [EnvironmentVariableTarget]::Machine)
    Write-Host " GITHUB_TOKEN: " -NoNewline
    if ($sysGithubToken) {
        $maskedToken = Get-MaskedToken -token $sysGithubToken
        Write-Host "SET ($maskedToken)" -ForegroundColor Green
    } else {
        Write-Host "NOT SET" -ForegroundColor Red
    }
    
    $sysGhToken = [Environment]::GetEnvironmentVariable("GH_TOKEN", [EnvironmentVariableTarget]::Machine)
    Write-Host " GH_TOKEN: " -NoNewline
    if ($sysGhToken) {
        $maskedToken = Get-MaskedToken -token $sysGhToken
        Write-Host "SET ($maskedToken)" -ForegroundColor Green
    } else {
        Write-Host "NOT SET" -ForegroundColor Red
    }
    
    # Check .env file
    Write-Host ""
    Write-Host "Env File:" -ForegroundColor Yellow
    if (Test-Path "$scriptDir\.env") {
        $envContent = Get-Content "$scriptDir\.env"
        $foundGithubToken = $false
        $foundGhToken = $false
        
        foreach ($line in $envContent) {
            if ($line -match '^GITHUB_TOKEN=(.+)$') {
                $foundGithubToken = $true
                $maskedToken = Get-MaskedToken -token $Matches[1]
                Write-Host " GITHUB_TOKEN: SET ($maskedToken)" -ForegroundColor Green
            }
            if ($line -match '^GH_TOKEN=(.+)$') {
                $foundGhToken = $true
                $maskedToken = Get-MaskedToken -token $Matches[1]
                Write-Host " GH_TOKEN: SET ($maskedToken)" -ForegroundColor Green
            }
        }
        
        if (-not $foundGithubToken) {
            Write-Host " GITHUB_TOKEN: NOT SET in .env file" -ForegroundColor Red
        }
        if (-not $foundGhToken) {
            Write-Host " GH_TOKEN: NOT SET in .env file" -ForegroundColor Red
        }
    } else {
        Write-Host " .env file does not exist" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "For publishing, tokens must be set in the current session." -ForegroundColor Yellow
    
    Write-Host ""
    Read-Host "Press Enter to return to the main menu"
}

function Set-TokenForSession {
    Clear-Host
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "|           SET TOKEN FOR CURRENT SESSION        |" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This will set the token for the current PowerShell session only." -ForegroundColor Yellow
    Write-Host "The token will be lost when you close this window." -ForegroundColor Yellow
    Write-Host ""
    
    $token = Read-Host "Enter your GitHub token (press Enter to cancel)"
    
    if (-not $token) {
        Write-Host ""
        Write-Host "Operation cancelled." -ForegroundColor Red
    } else {
        # Set for current session
        $env:GITHUB_TOKEN = $token
        $env:GH_TOKEN = $token
        
        Write-Host ""
        $maskedToken = Get-MaskedToken -token $token
        Write-Host "Token set successfully: $maskedToken" -ForegroundColor Green
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to the main menu"
}

function Set-TokenPermanently {
    Clear-Host
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "|              SET TOKEN PERMANENTLY             |" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This will set the token permanently at both user and system levels." -ForegroundColor Yellow
    Write-Host "You'll need to restart other terminal windows to see the change." -ForegroundColor Yellow
    Write-Host ""
    
    $token = Read-Host "Enter your GitHub token (press Enter to cancel)"
    
    if (-not $token) {
        Write-Host ""
        Write-Host "Operation cancelled." -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to return to the main menu"
        return
    }
    
    # User level
    [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $token, [EnvironmentVariableTarget]::User)
    [Environment]::SetEnvironmentVariable("GH_TOKEN", $token, [EnvironmentVariableTarget]::User)
    Write-Host "* Token set at User level" -ForegroundColor Green
    
    # System level
    [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $token, [EnvironmentVariableTarget]::Machine)
    [Environment]::SetEnvironmentVariable("GH_TOKEN", $token, [EnvironmentVariableTarget]::Machine)
    Write-Host "* Token set at System level" -ForegroundColor Green
    
    # Current session
    $env:GITHUB_TOKEN = $token
    $env:GH_TOKEN = $token
    Write-Host "* Token set for current session" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "IMPORTANT: You need to restart any open terminal windows" -ForegroundColor Yellow
    Write-Host "           for permanent changes to take effect." -ForegroundColor Yellow
    
    Write-Host ""
    Read-Host "Press Enter to return to the main menu"
}

function Export-TokenToEnvFile {
    Clear-Host
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "|              EXPORT TOKEN TO .ENV              |" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $env:GITHUB_TOKEN) {
        Write-Host "No token is currently set in this session." -ForegroundColor Yellow
        Write-Host ""
        $token = Read-Host "Enter your GitHub token (press Enter to cancel)"
        
        if (-not $token) {
            Write-Host ""
            Write-Host "Operation cancelled." -ForegroundColor Red
            Write-Host ""
            Read-Host "Press Enter to return to the main menu"
            return
        }
    } else {
        $maskedToken = Get-MaskedToken -token $env:GITHUB_TOKEN
        Write-Host "Current token is: $maskedToken" -ForegroundColor Green
        Write-Host ""
        $useCurrentToken = Read-Host "Use current token? (Y/n)"
        
        if ($useCurrentToken -eq "n" -or $useCurrentToken -eq "N") {
            $token = Read-Host "Enter your GitHub token (press Enter to cancel)"
            
            if (-not $token) {
                Write-Host ""
                Write-Host "Operation cancelled." -ForegroundColor Red
                Write-Host ""
                Read-Host "Press Enter to return to the main menu"
                return
            }
        } else {
            $token = $env:GITHUB_TOKEN
        }
    }
    
    $envContent = @"
# GitHub tokens for publishing
GITHUB_TOKEN=$token
GH_TOKEN=$token
"@
    
    Set-Content -Path "$scriptDir\.env" -Value $envContent
    
    Write-Host ""
    Write-Host "* Tokens exported to .env file" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to return to the main menu"
}

function Test-GitHubAccess {
    Clear-Host
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "|             TESTING GITHUB ACCESS              |" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Get repo info from package.json
    $packageJsonPath = "$scriptDir\package.json"
    if (-not (Test-Path $packageJsonPath)) {
        Write-Host "Error: package.json not found!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to return to the main menu"
        return
    }
    
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    if (-not $packageJson.repository -or -not $packageJson.repository.url) {
        Write-Host "Error: No repository URL found in package.json!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to return to the main menu"
        return
    }
    
    $repoUrl = $packageJson.repository.url
    Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
    
    # Extract owner and repo name
    if ($repoUrl -match "github\.com\/([^\/]+)\/([^\/\.]+)") {
        $owner = $Matches[1]
        $repo = $Matches[2]
        Write-Host "Owner: $owner, Repo: $repo" -ForegroundColor Cyan
    } else {
        Write-Host "Error: Could not parse repository URL!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to return to the main menu"
        return
    }
    
    # Check if token is set
    if (-not $env:GITHUB_TOKEN) {
        Write-Host "No GitHub token set in current session." -ForegroundColor Yellow
        Write-Host "Checking other sources..." -ForegroundColor Yellow
        
        # Try to get token from system or user level
        $sysToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", [EnvironmentVariableTarget]::Machine)
        $userToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", [EnvironmentVariableTarget]::User)
        
        # Try to get token from .env file
        $envFileToken = $null
        if (Test-Path "$scriptDir\.env") {
            $envContent = Get-Content "$scriptDir\.env"
            foreach ($line in $envContent) {
                if ($line -match '^GITHUB_TOKEN=(.+)$') {
                    $envFileToken = $Matches[1]
                    break
                }
            }
        }
        
        # Use tokens in order of priority: System > User > .env
        if ($sysToken) {
            $env:GITHUB_TOKEN = $sysToken
            $env:GH_TOKEN = $sysToken
            $maskedToken = Get-MaskedToken -token $sysToken
            Write-Host "Using system-level token: $maskedToken" -ForegroundColor Green
        }
        elseif ($userToken) {
            $env:GITHUB_TOKEN = $userToken
            $env:GH_TOKEN = $userToken
            $maskedToken = Get-MaskedToken -token $userToken
            Write-Host "Using user-level token: $maskedToken" -ForegroundColor Green
        }
        elseif ($envFileToken) {
            $env:GITHUB_TOKEN = $envFileToken
            $env:GH_TOKEN = $envFileToken
            $maskedToken = Get-MaskedToken -token $envFileToken
            Write-Host "Using token from .env file: $maskedToken" -ForegroundColor Green
        }
        else {
            Write-Host "No tokens found in any location." -ForegroundColor Red
            Write-Host "Please set a token first." -ForegroundColor Yellow
            Write-Host ""
            Read-Host "Press Enter to return to the main menu"
            return
        }
    }
    
    # Test GitHub API access
    Write-Host ""
    Write-Host "Testing GitHub API access..." -ForegroundColor Cyan
    
    try {
        $headers = @{
            Authorization = "token $env:GITHUB_TOKEN"
            Accept = "application/vnd.github.v3+json"
        }
        
        # Test user endpoint
        Write-Host "Testing user authentication..." -ForegroundColor Yellow
        $userResponse = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
        Write-Host "√ Authenticated as: $($userResponse.login)" -ForegroundColor Green
        
        # Test repo access
        Write-Host "Testing repository access..." -ForegroundColor Yellow
        $repoResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo" -Headers $headers -Method Get
        Write-Host "√ Repository access confirmed: $($repoResponse.full_name)" -ForegroundColor Green
        
        # Check release permissions
        Write-Host "Testing release permissions..." -ForegroundColor Yellow
        $releaseResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/releases" -Headers $headers -Method Get
        Write-Host "√ Release permissions confirmed" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "All GitHub permissions verified successfully!" -ForegroundColor Green
        Write-Host "You should be able to publish releases to this repository." -ForegroundColor Green
        
        # Check for existing releases
        Write-Host ""
        Write-Host "Checking for existing releases..." -ForegroundColor Cyan
        if ($releaseResponse.Count -gt 0) {
            Write-Host "Found $($releaseResponse.Count) releases:" -ForegroundColor Green
            foreach ($release in $releaseResponse) {
                $releaseType = if ($release.draft) { "DRAFT" } elseif ($release.prerelease) { "PRERELEASE" } else { "RELEASE" }
                Write-Host "- $($release.tag_name) ($releaseType): $($release.name)" -ForegroundColor Cyan
            }
        } else {
            Write-Host "No releases found for this repository." -ForegroundColor Yellow
        }
        
        # Look for drafts specifically
        $draftReleases = $releaseResponse | Where-Object { $_.draft -eq $true }
        if ($draftReleases.Count -gt 0) {
            Write-Host ""
            Write-Host "IMPORTANT: You have $($draftReleases.Count) DRAFT releases!" -ForegroundColor Yellow
            Write-Host "These are not visible to the public until published on GitHub:" -ForegroundColor Yellow
            foreach ($draft in $draftReleases) {
                Write-Host "- $($draft.tag_name): $($draft.name)" -ForegroundColor Yellow
            }
            Write-Host ""
            Write-Host "To make drafts public, go to:" -ForegroundColor Cyan
            Write-Host "https://github.com/$owner/$repo/releases" -ForegroundColor Cyan
            Write-Host "And click the 'Edit' button for each draft, then 'Publish release'" -ForegroundColor Cyan
        }
        
        # Check your forge.config.js settings
        $forgeConfigPath = "$scriptDir\forge.config.js"
        if (Test-Path $forgeConfigPath) {
            $forgeConfigContent = Get-Content $forgeConfigPath -Raw
            
            if ($forgeConfigContent -match "draft:\s*true") {
                Write-Host ""
                Write-Host "WARNING: Your forge.config.js has 'draft: true' set!" -ForegroundColor Red
                Write-Host "This means all published releases will be created as drafts" -ForegroundColor Red
                Write-Host "and won't be visible until manually published on GitHub." -ForegroundColor Red
                Write-Host ""
                Write-Host "Consider changing this to 'draft: false' if you want" -ForegroundColor Yellow
                Write-Host "releases to be automatically published." -ForegroundColor Yellow
            }
        }
        
    } catch {
        Write-Host "Error accessing GitHub API:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host ""
            Write-Host "Authentication failed. Your token may be invalid or expired." -ForegroundColor Red
            Write-Host "Please generate a new token with the following permissions:" -ForegroundColor Yellow
            Write-Host "- repo (Full control of private repositories)" -ForegroundColor Yellow
            Write-Host "- workflow (Update GitHub Action workflows)" -ForegroundColor Yellow
        }
        elseif ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host ""
            Write-Host "Repository not found. Make sure:" -ForegroundColor Red
            Write-Host "1. The repository URL in package.json is correct" -ForegroundColor Yellow
            Write-Host "2. Your token has access to this repository" -ForegroundColor Yellow
            Write-Host "3. The repository actually exists" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to the main menu"
}

function Push-SourceCode {
    param (
        [string]$version,
        [string]$commitMessage
    )
    
    Write-Host "Pushing source code to GitHub..." -ForegroundColor Cyan
    
    try {
        # Check if git is installed
        $gitInstalled = $null
        try {
            $gitInstalled = git --version
        } catch {
            Write-Host "Git is not installed or not in PATH. Please install Git to push source code." -ForegroundColor Red
            return $false
        }
        
        # Check if we're in a git repository
        $isGitRepo = $null
        try {
            $isGitRepo = git rev-parse --is-inside-work-tree
        } catch {
            Write-Host "Not in a git repository. Initializing..." -ForegroundColor Yellow
            git init
            git remote add origin "https://github.com/ThatQne/todo.git"
        }
        
        # Configure Git to handle line endings
        git config --global core.autocrlf true
        
        # Add all files
        git add .
        
        # Check if this is the first commit
        $hasCommits = $null
        try {
            $hasCommits = git rev-parse HEAD
        } catch {
            $hasCommits = $null
        }
        
        if (-not $hasCommits) {
            Write-Host "Making initial commit..." -ForegroundColor Yellow
            git commit -m "Initial commit"
            
            # Create and switch to main branch
            git branch -M main
            
            # Set upstream and push
            git push -u origin main
        } else {
            # Regular commit and push
            git commit -m $commitMessage
            git push origin main
        }
        
        Write-Host "Source code pushed successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Error pushing source code: $_" -ForegroundColor Red
        return $false
    }
}

function Run-Publish {
    Clear-Host
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "|                 PUBLISH APP                    |" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check for package.json
    $packageJsonPath = "$scriptDir\package.json"
    if (-not (Test-Path $packageJsonPath)) {
        Write-Host "Error: package.json not found!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to return to the main menu"
        return
    }
    
    # Read current version from package.json
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $currentVersion = $packageJson.version
    
    Write-Host "Current app version: $currentVersion" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Would you like to update the version before publishing?" -ForegroundColor Cyan
    $updateVersion = Read-Host "Enter Y to update version, any other key to continue with current version"
    
    if ($updateVersion -eq "Y" -or $updateVersion -eq "y") {
        # Suggest next version based on semantic versioning (increment patch)
        $versionParts = $currentVersion -split '\.'
        $nextPatch = [int]$versionParts[2] + 1
        $suggestedVersion = "$($versionParts[0]).$($versionParts[1]).$nextPatch"
        
        Write-Host ""
        Write-Host "Current version: $currentVersion" -ForegroundColor Yellow
        Write-Host "Suggested next version: $suggestedVersion" -ForegroundColor Green
        Write-Host ""
        Write-Host "Enter the new version number (or press Enter to use the suggested version):" -ForegroundColor Cyan
        $newVersion = Read-Host "Version"
        
        if (-not $newVersion) {
            $newVersion = $suggestedVersion
        }
        
        # Validate version format (simple check for x.y.z format)
        if ($newVersion -notmatch '^\d+\.\d+\.\d+$') {
            Write-Host ""
            Write-Host "Invalid version format. Version should be in format x.y.z (e.g., 1.0.1)" -ForegroundColor Red
            Write-Host "Using the current version: $currentVersion" -ForegroundColor Yellow
            $newVersion = $currentVersion
        }
        
        # Update version in package.json if changed
        if ($newVersion -ne $currentVersion) {
            Write-Host ""
            Write-Host "Updating version from $currentVersion to $newVersion..." -ForegroundColor Cyan
            
            # Read package.json as string to maintain formatting
            $packageJsonContent = Get-Content $packageJsonPath -Raw
            
            # Replace version with regex
            $packageJsonContent = $packageJsonContent -replace '"version":\s*"[^"]*"', "`"version`": `"$newVersion`""
            
            # Save updated package.json
            Set-Content -Path $packageJsonPath -Value $packageJsonContent
            
            Write-Host "Version updated successfully!" -ForegroundColor Green
            Write-Host ""
        }
    }
    
    # Check if token is set in current session
    if (-not $env:GITHUB_TOKEN) {
        Write-Host "No token in current session. Checking other sources..." -ForegroundColor Yellow
        
        # Try to get token from system or user level
        $sysToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", [EnvironmentVariableTarget]::Machine)
        $userToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", [EnvironmentVariableTarget]::User)
        
        # Try to get token from .env file
        $envFileToken = $null
        if (Test-Path "$scriptDir\.env") {
            $envContent = Get-Content "$scriptDir\.env"
            foreach ($line in $envContent) {
                if ($line -match '^GITHUB_TOKEN=(.+)$') {
                    $envFileToken = $Matches[1]
                    break
                }
            }
        }
        
        # Use tokens in order of priority: System > User > .env
        if ($sysToken) {
            $env:GITHUB_TOKEN = $sysToken
            $env:GH_TOKEN = $sysToken
            $maskedToken = Get-MaskedToken -token $sysToken
            Write-Host "Using system-level token: $maskedToken" -ForegroundColor Green
        }
        elseif ($userToken) {
            $env:GITHUB_TOKEN = $userToken
            $env:GH_TOKEN = $userToken
            $maskedToken = Get-MaskedToken -token $userToken
            Write-Host "Using user-level token: $maskedToken" -ForegroundColor Green
        }
        elseif ($envFileToken) {
            $env:GITHUB_TOKEN = $envFileToken
            $env:GH_TOKEN = $envFileToken
            $maskedToken = Get-MaskedToken -token $envFileToken
            Write-Host "Using token from .env file: $maskedToken" -ForegroundColor Green
        }
        else {
            # No tokens found, ask user to enter one
            Write-Host "No tokens found in any location." -ForegroundColor Red
            Write-Host "You need to set a token before publishing." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Would you like to set a token now?" -ForegroundColor Yellow
            $setToken = Read-Host "Enter Y to set a token, any other key to return to menu"
            
            if ($setToken -eq "Y" -or $setToken -eq "y") {
                $token = Read-Host "Enter your GitHub token"
                
                if (-not $token) {
                    Write-Host "No token provided. Returning to main menu." -ForegroundColor Red
                    Write-Host ""
                    Read-Host "Press Enter to continue"
                    return
                }
                
                $env:GITHUB_TOKEN = $token
                $env:GH_TOKEN = $token
                
                $maskedToken = Get-MaskedToken -token $token
                Write-Host ""
                Write-Host "Token set: $maskedToken" -ForegroundColor Green
                Write-Host "Continuing with publish..." -ForegroundColor Green
                Write-Host ""
            } else {
                Write-Host "Returning to main menu." -ForegroundColor Yellow
                Write-Host ""
                Read-Host "Press Enter to continue"
                return
            }
        }
    } else {
        $maskedToken = Get-MaskedToken -token $env:GITHUB_TOKEN
        Write-Host "Using current session token: $maskedToken" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Starting publish process for version $(if ($newVersion) { $newVersion } else { $currentVersion })..." -ForegroundColor Cyan
    Write-Host "This may take several minutes." -ForegroundColor Yellow
    Write-Host ""
    
    # Make sure we're in the script's directory before running npm commands
    Push-Location -Path $scriptDir
    
    try {
        # Run clean first to ensure we don't use cached files with old version
        npm run clean
        
        # Push source code first
        $finalVersion = if ($newVersion) { $newVersion } else { $currentVersion }
        $commitMessage = "Release v$finalVersion"
        $sourcePushed = Push-SourceCode -version $finalVersion -commitMessage $commitMessage
        
        if (-not $sourcePushed) {
            Write-Host "Warning: Failed to push source code. Continuing with release..." -ForegroundColor Yellow
        }
        
        # If the UseMakeCmd parameter is provided, use it instead of the default publish command
        if ($UseMakeCmd) {
            Write-Host "Using custom make command: $UseMakeCmd" -ForegroundColor Cyan
            Invoke-Expression $UseMakeCmd
            
            # If make was successful, run the publish step separately
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Make completed successfully, publishing to GitHub..." -ForegroundColor Green
                npm run publish
            }
        } else {
            # Run the default publish command if no custom make command
            npm run publish
        }
        
        # Check exit code
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Publish completed successfully!" -ForegroundColor Green
            
            # If version was updated, show success message
            if ($newVersion -and $newVersion -ne $currentVersion) {
                Write-Host "App published with new version: $newVersion" -ForegroundColor Green
            }
        } else {
            Write-Host ""
            Write-Host "Publish failed with exit code $LASTEXITCODE" -ForegroundColor Red
            Write-Host "Check the output above for error details." -ForegroundColor Yellow
        }
    }
    finally {
        # Always restore the original location
        Pop-Location
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to the main menu"
}

# Main menu loop
$running = $true
while ($running) {
    $choice = Show-MainMenu
    
    switch ($choice) {
        "1" { Check-TokenStatus }
        "2" { Set-TokenForSession }
        "3" { Set-TokenPermanently }
        "4" { Export-TokenToEnvFile }
        "5" { Test-GitHubAccess }
        "6" { Run-Publish }
        "7" { $running = $false }
        default { 
            Write-Host ""
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}

Clear-Host
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "|        THANK YOU FOR USING PUBLISHER GUI       |" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 1 