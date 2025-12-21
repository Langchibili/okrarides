$root = 'c:\Users\langson\Projects\Okra\Okrarides\backend\src\api'
$files = Get-ChildItem -Path $root -Recurse -Filter 'schema.json' -File
$result = foreach ($f in $files) {
  try { $j = Get-Content $f.FullName -Raw | ConvertFrom-Json } catch { $j = $null }
  $contentTypesParent = Split-Path $f.FullName -Parent
  # climb up three levels to get the api folder name: ...\\api\\{apiFolder}\\content-types\\{ct}\\schema.json
  $apiFolder = Split-Path (Split-Path (Split-Path $contentTypesParent -Parent) -Parent) -Leaf

  function get-field($obj, $names) {
    foreach ($n in $names) {
      if ($obj -ne $null -and $obj.PSObject.Properties.Name -contains $n) { return $obj.$n }
    }
    return $null
  }

  $singular = $null
  $plural = $null
  $display = $null

  if ($j -ne $null) {
    $singular = get-field $j @('singularName','singular_name')
    if ($singular -eq $null -and $j.info) { $singular = get-field $j.info @('singularName','singular_name','singular') }

    $plural = get-field $j @('pluralName','plural_name')
    if ($plural -eq $null -and $j.info) { $plural = get-field $j.info @('pluralName','plural_name','plural') }

    $display = get-field $j.info @('displayName','display_name','name')
    if ($display -eq $null) { $display = get-field $j @('displayName','display_name') }
  }

  [PSCustomObject]@{
    path = $f.FullName
    apiFolder = $apiFolder
    singular = $singular
    plural = $plural
    display = $display
  }
}
$result | ConvertTo-Json -Depth 5
