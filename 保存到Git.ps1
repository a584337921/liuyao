Set-Location $PSScriptRoot
git add .
$dt = Get-Date -Format 'yyyyMMdd_HHmmss'
git commit -m "备份_$dt"
Write-Host ""
Write-Host "===== 最近3条记录 ====="
git log --oneline -3
Write-Host ""
Write-Host "备份完成"
Read-Host "按回车键退出"
