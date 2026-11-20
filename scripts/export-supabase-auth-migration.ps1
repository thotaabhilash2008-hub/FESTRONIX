Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$secureUri = Read-Host 'Paste the full Supabase Postgres URI (input is hidden)' -AsSecureString
$uriPointer = [IntPtr]::Zero
$databaseUri = $null
$caCertificatePath = $null
$previousExtraCaCertificates = $env:NODE_EXTRA_CA_CERTS
$previousSystemCa = $env:NODE_USE_SYSTEM_CA

try {
    $uriPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUri)
    $databaseUri = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($uriPointer)
    if ($databaseUri -notmatch '^postgres(ql)?://') {
        throw 'That does not look like a PostgreSQL connection URI.'
    }

    $caCertificateInput = Read-Host 'Path to the Supabase database CA certificate (.crt) from Project Settings > Database > SSL Configuration'
    $caCertificateInput = $caCertificateInput.Trim().Trim('"')
    if (-not $caCertificateInput -or -not (Test-Path -LiteralPath $caCertificateInput -PathType Leaf)) {
        throw 'The Supabase CA certificate file was not found. Download the project certificate from Database SSL Configuration and rerun the export.'
    }
    $caCertificatePath = (Resolve-Path -LiteralPath $caCertificateInput).Path
    $caCertificateText = Get-Content -LiteralPath $caCertificatePath -Raw
    if ($caCertificateText -notmatch '-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----') {
        throw 'The selected file is not a PEM certificate. Use the .crt certificate downloaded from Supabase Database SSL Configuration.'
    }

    $outputDirectory = Join-Path $env:LOCALAPPDATA 'FestronixMigration\supabase-auth-export'
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

    # The export contains password hashes and account metadata. Restrict its
    # directory to the current Windows user and SYSTEM using DACL-only tooling.
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $userGrant = '{0}:(OI)(CI)F' -f $identity
    $aclOutput = @(& icacls.exe $outputDirectory '/inheritance:r' '/grant:r' $userGrant 'SYSTEM:(OI)(CI)F' 2>&1)
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not restrict the local Auth export folder permissions. No database query was run.'
    }

    $env:FESTRONIX_SUPABASE_DATABASE_URI = $databaseUri
    # Trust the project's published CA while retaining TLS chain and hostname
    # validation. NODE_EXTRA_CA_CERTS is supported by the installed Node 22.17.
    $env:NODE_EXTRA_CA_CERTS = $caCertificatePath
    if ([version]((& node --version) -replace '^v', '') -ge [version]'22.19.0') {
        $env:NODE_USE_SYSTEM_CA = '1'
    }
    $nodeScript = Join-Path $PSScriptRoot 'export-supabase-auth-migration.mjs'
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $nodeOutput = @(& node $nodeScript 2>&1)
        $exportExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    foreach ($line in $nodeOutput) { Write-Host ([string]$line) }
    if ($exportExitCode -ne 0) {
        throw 'Auth export stopped. Review the sanitized Node/Postgres diagnostic above; no Supabase data was changed.'
    }
}
finally {
    Remove-Item Env:FESTRONIX_SUPABASE_DATABASE_URI -ErrorAction SilentlyContinue
    if ($null -eq $previousExtraCaCertificates) {
        Remove-Item Env:NODE_EXTRA_CA_CERTS -ErrorAction SilentlyContinue
    } else {
        $env:NODE_EXTRA_CA_CERTS = $previousExtraCaCertificates
    }
    if ($null -eq $previousSystemCa) {
        Remove-Item Env:NODE_USE_SYSTEM_CA -ErrorAction SilentlyContinue
    } else {
        $env:NODE_USE_SYSTEM_CA = $previousSystemCa
    }
    $databaseUri = $null
    $caCertificateText = $null
    $caCertificatePath = $null
    if ($uriPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($uriPointer)
    }
    $secureUri.Dispose()
}
