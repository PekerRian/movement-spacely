$files = Get-ChildItem -Path "e:\PEKER\MOVEMENT\space\frontend\src" -Include "*.tsx","*.ts","*.jsx","*.js","*.css" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    $content = $content -replace '//.*', ''
    
    $content = $content -replace '/\*[\s\S]*?\*/', ''
    
    $content = $content -replace '(?m)^\s*$(\r?\n)', ''
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Cleaned: $($file.Name)"
}

Write-Host "`nAll comments removed from frontend files!"
