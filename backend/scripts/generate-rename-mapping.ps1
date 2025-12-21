$root = 'c:\Users\langson\Projects\Okra\Okrarides\backend\src\api'
$files = Get-ChildItem -Path $root -Recurse -Filter 'schema.json' -File
$result = foreach ($f in $files) {
  try { $j = Get-Content $f.FullName -Raw | ConvertFrom-Json } catch { $j = $null }
  $contentTypeFolder = Split-Path $f.FullName -Parent | Split-Path -Leaf
  $apiFolder = Split-Path (Split-Path (Split-Path $f.FullName -Parent) -Parent) -Leaf
  $singular = if ($j -ne $null) { if ($j.info -ne $null) { $j.info.singularName } else { $j.singularName } } else { $null }
  $plural = if ($j -ne $null) { if ($j.info -ne $null) { $j.info.pluralName } else { $j.pluralName } } else { $null }
  $display = if ($j -ne $null) { if ($j.info -ne $null) { $j.info.displayName } else { $j.displayName } } else { $null }
  $currentUID = "api::${apiFolder}.${contentTypeFolder}"
  $desiredApiFolder = if ($singular -and $singular -ne '') { $singular } else { $apiFolder }
  $desiredUID = "api::${desiredApiFolder}.${contentTypeFolder}"
  [PSCustomObject]@{
    path = $f.FullName
    apiFolder = $apiFolder
    contentTypeFolder = $contentTypeFolder
    singular = $singular
    plural = $plural
    display = $display
    currentUID = $currentUID
    desiredApiFolder = $desiredApiFolder
    desiredUID = $desiredUID
    needsRename = ($apiFolder -ne $desiredApiFolder)
  }
}
$result | ConvertTo-Json -Depth 6
