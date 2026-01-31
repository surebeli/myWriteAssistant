#!/bin/bash
# Tauri 开发启动脚本
# 需要 Node.js >= 20.9.0 和 Rust

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 切换到 Node.js 22
nvm use 22 2>/dev/null || {
    echo "警告: 请确保 Node.js >= 20.9.0"
    echo "当前版本: $(node --version)"
}

# 加载 Rust
source "$HOME/.cargo/env" 2>/dev/null

# 启动 Tauri 开发模式
echo "🚀 启动 My Write Assistant (Tauri 开发模式)..."
npm run tauri:dev
