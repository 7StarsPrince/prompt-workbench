#!/bin/bash
set -e

echo "🖖 Prompt Workbench 启动脚本"
echo "==========================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 启动后端
echo "📦 [1/2] 启动后端 (端口 3001)..."
cd "$(dirname "$0")/backend"

if [ ! -d "node_modules" ]; then
    echo "   首次安装后端依赖，请稍等..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "   ⚠️  未找到 .env 文件，创建示例..."
    cat > .env << 'EOF'
PORT=3001
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
OPENCLAW_API_KEY=your_openclaw_api_key_here
EOF
    echo "   ⚠️  请编辑 backend/.env 填入你的 API Key"
fi

# 后台启动后端
npm start &
BACKEND_PID=$!
echo "   ✅ 后端已启动 (PID: $BACKEND_PID)"
echo ""

# 等待后端就绪
sleep 2

# 启动前端
echo "🎨 [2/2] 启动前端 (端口 3000)..."
cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
    echo "   首次安装前端依赖，请稍等..."
    npm install
fi

# 启动前端（会占用当前终端）
echo ""
echo "==========================="
echo "🚀 启动完成！"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:3001"
echo "==========================="
echo ""
echo "按 Ctrl+C 停止前端，后端会在后台继续运行"
echo "停止后端: kill $BACKEND_PID"
echo ""

npm start
