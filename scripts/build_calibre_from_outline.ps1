Param(
  [string]$OutlinePath = "Outline Draft/OutlineDraft.html",
  [string]$TemplateDir = "calibre_template",
  [string]$OutDir = "calibre_book",
  [string]$ZipOut = "calibre_book.zip",
  [switch]$Normalize
)

$ErrorActionPreference = 'Stop'

if (!(Test-Path $OutlinePath)) {
  Write-Error "Outline not found: $OutlinePath"
}

if (Test-Path $OutDir) { Remove-Item -Recurse -Force $OutDir }
Copy-Item -Recurse -Force $TemplateDir $OutDir

function Normalize-OutlineHtml {
  param([string]$html)

  # Keep title if present
  $title = "Survival Guide"
  if ($html -match '<title>(.*?)</title>') { $title = [System.Web.HttpUtility]::HtmlDecode($matches[1]) }

  # Extract body content if available
  $body = $html
  if ($html -match '<body[^>]*>([\s\S]*?)</body>') { $body = $matches[1] }

  # Remove style/script blocks and comments
  $body = [regex]::Replace($body, '<style[\s\S]*?</style>', '', 'IgnoreCase')
  $body = [regex]::Replace($body, '<script[\s\S]*?</script>', '', 'IgnoreCase')
  $body = [regex]::Replace($body, '<!--[\s\S]*?-->', '', 'IgnoreCase')

  # Drop most inline wrappers but keep their text
  $body = [regex]::Replace($body, '<span[^>]*>', '', 'IgnoreCase')
  $body = $body -replace '</span>', ''

  # Convert bold-only paragraphs to h2
  $body = [regex]::Replace($body, '<p[^>]*>\s*(?:<strong>|<b>)([\s\S]*?)(?:</strong>|</b>)\s*</p>', '<h2>$1</h2>', 'IgnoreCase')
  # Convert paragraphs with inline bold style to h2
  $body = [regex]::Replace($body, '<p[^>]*style="[^"]*(font-weight\s*:\s*bold|700)[^"]*"[^>]*>([\s\S]*?)</p>', '<h2>$2</h2>', 'IgnoreCase')

  # Convert paragraphs that start with Chapter/CHAPTER to h1
  $body = [regex]::Replace($body, '<p[^>]*>\s*(CHAPTER\s+\d+[^<]*?)\s*</p>', '<h1>$1</h1>', 'IgnoreCase')
  $body = [regex]::Replace($body, '<p[^>]*>\s*(Chapter\s+\d+[^<]*?)\s*</p>', '<h1>$1</h1>', 'IgnoreCase')

  # Collapse excessive attributes from remaining tags
  $body = [regex]::Replace($body, '\s(?:class|style|id|dir|data-[^=]+)="[^"]*"', '', 'IgnoreCase')

  # Cleanup nbsp and redundant whitespace
  $body = $body -replace '&nbsp;', ' '
  $body = [regex]::Replace($body, '\s{2,}', ' ')

  # Build minimal, EPUB-friendly HTML
  $skeleton = @"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>$title</title>
    <link rel="stylesheet" href="styles.css" />
    <link rel="stylesheet" href="extra-css.css" />
  </head>
  <body>
  $body
  </body>
  </html>
"@
  return $skeleton
}

if ($Normalize) {
  $raw = Get-Content -Raw -Path $OutlinePath
  Add-Type -AssemblyName System.Web
  $normalized = Normalize-OutlineHtml -html $raw
  Set-Content -Path (Join-Path $OutDir 'index.html') -Value $normalized -Encoding UTF8
} else {
  # Replace template index with raw outline
  Copy-Item -Force $OutlinePath (Join-Path $OutDir 'index.html')
}

# Remove placeholder image keeper if present
$keep = Join-Path $OutDir 'images/.keep'
if (Test-Path $keep) { Remove-Item -Force $keep }

# Create zip archive ready for Calibre "Add from archive"
if (Test-Path $ZipOut) { Remove-Item -Force $ZipOut }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($OutDir, $ZipOut)

Write-Host "Created: $OutDir and $ZipOut"

