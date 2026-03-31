#!/usr/bin/env bash
# EchoMind 快速部署脚本
# 用法: ./deploy.sh
# 原理: rsync 代码（~200KB）→ 服务器本地 docker build（利用层缓存）

set -e

SERVER="ubuntu@170.9.43.216"
KEY="/Users/pys/Downloads/oracle cloud/oraclecloudkeys/4c24g.key"
REMOTE_DIR="/home/ubuntu/projects/echomind-api"
SSH="ssh -i \"$KEY\" -o StrictHostKeyChecking=no"

echo "🚀 [1/3] 同步代码到服务器..."
rsync -avz --progress \
  -e "ssh -i \"$KEY\" -o StrictHostKeyChecking=no" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.env.backend' \
  --exclude='storage/' \
  --exclude='.expo' \
  --exclude='android' \
  --exclude='ios' \
  backend/ \
  "$SERVER:$REMOTE_DIR/backend/"

echo "🔨 [2/3] 服务器构建并重启容器..."
ssh -i "$KEY" -o StrictHostKeyChecking=no "$SERVER" "
  cd $REMOTE_DIR &&
  docker build -t echomind-api:latest -f Dockerfile . &&
  docker stop echomind-api 2>/dev/null || true &&
  docker rm echomind-api 2>/dev/null || true &&
  docker run -d \
    --name echomind-api \
    --env-file .env.backend \
    -p 127.0.0.1:18000:8000 \
    -v $REMOTE_DIR/storage/generated-images:/app/storage/generated-images \
    --restart unless-stopped \
    echomind-api:latest &&
  echo '⏳ 等待服务启动...' &&
  sleep 6 &&
  curl -s http://127.0.0.1:18000/api/v1/health
"

echo "✅ [3/3] 部署完成！"
