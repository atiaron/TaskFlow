# SSD and RAM Optimization for TaskFlow Build
# This file contains optimizations for maximum build speed

# Set Node.js memory limit to 16GB (adjust based on your system)
$env:NODE_OPTIONS = "--max-old-space-size=16384"

# Verify current setting
Write-Host "✅ Node.js memory limit set to 16GB"
Write-Host "NODE_OPTIONS: $env:NODE_OPTIONS"

# Check available RAM
$totalRAM = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
Write-Host "💾 Total System RAM: $([math]::Round($totalRAM, 2)) GB"

# Recommendations for RAM Disk (optional)
Write-Host ""
Write-Host "🚀 Optional RAM Disk Setup:"
Write-Host "1. For systems with 16GB+ RAM, consider creating a RAM disk"
Write-Host "2. Move node_modules to RAM disk for ultra-fast access"
Write-Host "3. Commands below create a 4GB RAM disk (run as Administrator):"
Write-Host ""
Write-Host "   New-VHD -Path 'C:\ramdisk.vhdx' -SizeBytes 4GB -Dynamic"
Write-Host "   Mount-VHD -Path 'C:\ramdisk.vhdx'"
Write-Host "   # Then create symbolic link:"
Write-Host "   # mklink /D 'node_modules' 'R:\node_modules'"
Write-Host ""
Write-Host "⚠️  Note: RAM disk is optional and requires Administrator privileges"
