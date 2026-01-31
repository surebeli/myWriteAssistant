#!/bin/bash
# Tauri 生产构建脚本
# 生成 .dmg (macOS), .msi (Windows), .deb/.AppImage (Linux)

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 切换到 Node.js 22
nvm use 22 2>/dev/null || {
    echo "警告: 请确保 Node.js >= 20.9.0"
}

# 加载 Rust
source "$HOME/.cargo/env" 2>/dev/null

echo "📦 构建 My Write Assistant 桌面应用..."
echo ""

# 构建
npm run tauri:build

echo ""
echo "✅ 构建完成！"
echo "📁 安装包位置: src-tauri/target/release/bundle/"
