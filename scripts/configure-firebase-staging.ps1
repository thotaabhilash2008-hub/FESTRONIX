Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectId = 'festronix-migration-stg26'
$webAppId = '1:96928303308:web:c14f5afc295024a95eda69'
$outputPath = Join-Path $PSScriptRoot '..\.env.local'
$outputPath = [IO.Path]::GetFullPath($outputPath)

$oldPreference = $ErrorActionPreference
try {
    # Firebase CLI progress can be written to stderr even when the command
    # succeeds. Capture it so the config parser receives one sanitized string.
    $ErrorActionPreference = 'Continue'
    $cliLines = @(& firebase apps:sdkconfig WEB $webAppId "--project=$projectId" --json --non-interactive 2>&1)
    $firebaseExitCode = $LASTEXITCODE
}
finally {
    $ErrorActionPreference = $oldPreference
}

if ($firebaseExitCode -ne 0) {
    throw 'Firebase CLI could not read the staging web-app configuration. Sign in with the Firebase CLI account that owns the staging project, then rerun this script.'
}

$cliText = $cliLines -join "`n"
$jsonStart = $cliText.IndexOf('{')
$jsonEnd = $cliText.LastIndexOf('}')
if ($jsonStart -lt 0 -or $jsonEnd -le $jsonStart) {
    throw 'Firebase CLI returned an unreadable staging configuration.'
}

try {
    $response = $cliText.Substring($jsonStart, $jsonEnd - $jsonStart + 1) | ConvertFrom-Json
    $config = $response.result.sdkConfig
}
catch {
    throw 'Firebase CLI returned an unreadable staging configuration.'
}

if ($config.projectId -ne $projectId -or $config.appId -ne $webAppId -or -not $config.apiKey -or -not $config.authDomain) {
    throw 'The Firebase configuration did not match the expected staging project and web app.'
}

$managedValues = [ordered]@{
    VITE_FIREBASE_API_KEY = $config.apiKey
    VITE_FIREBASE_AUTH_DOMAIN = $config.authDomain
    VITE_FIREBASE_PROJECT_ID = $config.projectId
    VITE_FIREBASE_APP_ID = $config.appId
    VITE_FIREBASE_MESSAGING_SENDER_ID = $config.messagingSenderId
}

$managedNames = @($managedValues.Keys)
$existingLines = if (Test-Path -LiteralPath $outputPath) {
    @(Get-Content -LiteralPath $outputPath)
} else {
    @()
}
$preservedLines = @($existingLines | Where-Object {
    $line = [string]$_
    $key = ($line -split '=', 2)[0]
    $managedNames -notcontains $key
})
$configLines = @($managedValues.GetEnumerator() | ForEach-Object { '{0}={1}' -f $_.Key, $_.Value })
$finalLines = @($preservedLines + $configLines)
[IO.File]::WriteAllLines($outputPath, $finalLines, [Text.UTF8Encoding]::new($false))

Write-Host "Wrote Firebase web configuration for $projectId to the ignored local .env.local file."
Write-Host 'This is public client configuration, not a service credential. Production Supabase flows are unchanged.'
