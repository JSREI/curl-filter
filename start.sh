#!/bin/bash

# coze-plugin-curl-filter 一键启动脚本
# 功能：自动杀死之前的进程，保证单个实例启动
#
# 使用方法：
#   ./start.sh          # 启动服务
#   ./start.sh --help   # 显示帮助信息
#
# 功能特性：
#   1. 自动检测并终止占用端口 25519 的进程
#   2. 自动检测并终止项目相关的 Node.js 进程
#   3. 检查并安装项目依赖（如果需要）
#   4. 启动 Vite 开发服务器
#   5. 生成详细的启动日志
#   6. 提供彩色输出和进度提示

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="coze-plugin-curl-filter"
PORT=25519
LOG_FILE="./server.log"

# 显示帮助信息
show_help() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $PROJECT_NAME 服务启动脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}使用方法:${NC}"
    echo -e "  ./start.sh          启动服务"
    echo -e "  ./start.sh --help   显示此帮助信息"
    echo ""
    echo -e "${GREEN}功能特性:${NC}"
    echo -e "  • 自动检测并终止占用端口 $PORT 的进程"
    echo -e "  • 自动检测并终止项目相关的 Node.js 进程"
    echo -e "  • 检查并安装项目依赖（如果需要）"
    echo -e "  • 启动 Vite 开发服务器"
    echo -e "  • 生成详细的启动日志到 $LOG_FILE"
    echo -e "  • 提供彩色输出和进度提示"
    echo ""
    echo -e "${GREEN}服务信息:${NC}"
    echo -e "  • 项目名称: $PROJECT_NAME"
    echo -e "  • 服务端口: $PORT"
    echo -e "  • 访问地址: http://localhost:$PORT"
    echo -e "  • 日志文件: $LOG_FILE"
    echo -e "${BLUE}========================================${NC}"
}

# 处理命令行参数
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  $PROJECT_NAME 服务启动脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: npm 未安装，请先安装 npm${NC}"
    exit 1
fi

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 当前目录下未找到 package.json 文件${NC}"
    echo -e "${RED}请确保在项目根目录下执行此脚本${NC}"
    exit 1
fi

# 函数：杀死占用指定端口的进程
kill_port_process() {
    local port=$1
    echo -e "${YELLOW}正在检查端口 $port 的占用情况...${NC}"
    
    # 查找占用端口的进程
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}发现端口 $port 被以下进程占用: $pids${NC}"
        echo -e "${YELLOW}正在终止这些进程...${NC}"
        
        # 尝试优雅地终止进程
        for pid in $pids; do
            if kill -TERM $pid 2>/dev/null; then
                echo -e "${GREEN}已发送 TERM 信号给进程 $pid${NC}"
            fi
        done
        
        # 等待 3 秒让进程优雅退出
        sleep 3
        
        # 检查进程是否还在运行，如果是则强制杀死
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${YELLOW}部分进程仍在运行，强制终止...${NC}"
            for pid in $remaining_pids; do
                if kill -KILL $pid 2>/dev/null; then
                    echo -e "${GREEN}已强制终止进程 $pid${NC}"
                fi
            done
        fi
        
        echo -e "${GREEN}端口 $port 已清理完成${NC}"
    else
        echo -e "${GREEN}端口 $port 未被占用${NC}"
    fi
}

# 函数：杀死项目相关的 Node.js 进程
kill_project_processes() {
    echo -e "${YELLOW}正在查找项目相关的进程...${NC}"
    
    # 查找包含项目名称或 vite 的 Node.js 进程
    local pids=$(ps aux | grep -E "(node.*vite|node.*$PROJECT_NAME)" | grep -v grep | awk '{print $2}' || true)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}发现项目相关进程: $pids${NC}"
        echo -e "${YELLOW}正在终止这些进程...${NC}"
        
        for pid in $pids; do
            if kill -TERM $pid 2>/dev/null; then
                echo -e "${GREEN}已发送 TERM 信号给进程 $pid${NC}"
            fi
        done
        
        # 等待进程退出
        sleep 2
        
        # 检查是否还有残留进程
        local remaining_pids=$(ps aux | grep -E "(node.*vite|node.*$PROJECT_NAME)" | grep -v grep | awk '{print $2}' || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${YELLOW}强制终止残留进程...${NC}"
            for pid in $remaining_pids; do
                if kill -KILL $pid 2>/dev/null; then
                    echo -e "${GREEN}已强制终止进程 $pid${NC}"
                fi
            done
        fi
    else
        echo -e "${GREEN}未发现项目相关进程${NC}"
    fi
}

# 清理之前的进程
echo -e "${BLUE}步骤 1: 清理之前的进程${NC}"
kill_port_process $PORT
kill_project_processes

# 检查依赖是否安装
echo -e "${BLUE}步骤 2: 检查项目依赖${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules 目录不存在，正在安装依赖...${NC}"
    npm install
    echo -e "${GREEN}依赖安装完成${NC}"
else
    echo -e "${GREEN}依赖已存在${NC}"
fi

# 清理旧的日志文件
if [ -f "$LOG_FILE" ]; then
    echo -e "${YELLOW}清理旧的日志文件...${NC}"
    rm -f "$LOG_FILE"
fi

# 启动服务
echo -e "${BLUE}步骤 3: 启动服务${NC}"
echo -e "${GREEN}正在启动 $PROJECT_NAME 服务...${NC}"
echo -e "${GREEN}服务将运行在端口: $PORT${NC}"
echo -e "${GREEN}日志文件: $LOG_FILE${NC}"

# 启动开发服务器
npm run dev > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 5

# 检查服务是否成功启动
if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  服务启动成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}服务地址: http://localhost:$PORT${NC}"
    echo -e "${GREEN}进程 ID: $SERVER_PID${NC}"
    echo -e "${GREEN}日志文件: $LOG_FILE${NC}"
    echo -e "${YELLOW}使用 Ctrl+C 停止服务或运行以下命令:${NC}"
    echo -e "${YELLOW}kill $SERVER_PID${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    # 显示最后几行日志
    echo -e "${BLUE}最新日志:${NC}"
    tail -n 10 "$LOG_FILE" 2>/dev/null || echo -e "${YELLOW}暂无日志输出${NC}"
    
    # 等待用户中断或进程结束
    wait $SERVER_PID
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  服务启动失败！${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}请检查日志文件: $LOG_FILE${NC}"
    if [ -f "$LOG_FILE" ]; then
        echo -e "${RED}错误信息:${NC}"
        tail -n 20 "$LOG_FILE"
    fi
    exit 1
fi
