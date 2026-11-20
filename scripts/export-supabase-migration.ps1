Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCommand) {
    throw 'Docker Desktop is required for this Supabase export. Install Docker Desktop, start it, and wait for the engine to be ready.'
}

$previousErrorActionPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    $dockerOutput = @(& docker info --format '{{.ServerVersion}}' 2>&1)
    $dockerExitCode = $LASTEXITCODE
}
finally {
    $ErrorActionPreference = $previousErrorActionPreference
}
if ($dockerExitCode -ne 0) {
    throw 'Docker Desktop is installed but its engine is not running. Start Docker Desktop, wait until it says the engine is running, then rerun this script.'
}

$secureUri = Read-Host 'Paste the full Supabase Postgres URI (input is hidden)' -AsSecureString
$uriPtr = [IntPtr]::Zero
$databaseUri = $null

try {
    $uriPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUri)
    $databaseUri = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($uriPtr)

    if ($databaseUri -notmatch '^postgres(ql)?://') {
        throw 'That does not look like a PostgreSQL connection URI.'
    }

    $outputDirectory = Join-Path $env:LOCALAPPDATA 'FestronixMigration\supabase-export'
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    $schemaPath = Join-Path $outputDirectory 'public-schema.sql'
    $dataPath = Join-Path $outputDirectory 'public-data.sql'
    $remoteArgument = "--remote=$databaseUri"

    function Invoke-SupabaseDump {
        param(
            [Parameter(Mandatory = $true)][string[]]$Arguments,
            [Parameter(Mandatory = $true)][string]$FailureMessage
        )

        $previousErrorActionPreference = $ErrorActionPreference
        try {
            # Supabase CLI writes its informational "Target:" line to stderr.
            # In Windows PowerShell, Stop would turn that native stderr line
            # into a terminating NativeCommandError even when the dump succeeds.
            $ErrorActionPreference = 'Continue'
            $commandOutput = @(& npx --yes supabase@latest @Arguments 2>&1)
            $commandExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorActionPreference
        }

        foreach ($line in $commandOutput) {
            ([string]$line -replace [regex]::Escape($databaseUri), '[connection hidden]') |
                Write-Host
        }

        if ($commandExitCode -ne 0) {
            throw $FailureMessage
        }
    }

    Write-Host "Export destination: $outputDirectory"
    Write-Host 'Exporting the public schema (no rows)...'
    Invoke-SupabaseDump `
        -Arguments @('db', 'dump', $remoteArgument, '--schema', 'public', '--file', $schemaPath) `
        -FailureMessage 'Schema export failed. Review the CLI message above; the connection URI was not printed.'

    Write-Host 'Exporting public table data...'
    Invoke-SupabaseDump `
        -Arguments @('db', 'dump', $remoteArgument, '--schema', 'public', '--data-only', '--use-copy', '--file', $dataPath) `
        -FailureMessage 'Data export failed. Review the CLI message above; the connection URI was not printed.'

    foreach ($path in @($schemaPath, $dataPath)) {
        if (-not (Test-Path -LiteralPath $path) -or (Get-Item -LiteralPath $path).Length -eq 0) {
            throw "Expected export file is missing or empty: $path"
        }
    }

    Get-ChildItem -LiteralPath $outputDirectory -File |
        Select-Object Name, Length, LastWriteTime |
        Format-Table -AutoSize
    Write-Host 'Done. These files stay in Local AppData and are not placed in the Git repository.'
}
finally {
    Remove-Variable databaseUri, remoteArgument -ErrorAction SilentlyContinue
    if ($uriPtr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($uriPtr)
    }
    $secureUri.Dispose()
}
