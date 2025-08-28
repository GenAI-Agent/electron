#!/usr/bin/env python3
"""
Supervisor Agent API 服務器主文件

標準的 FastAPI 應用結構，支持模塊化路由。
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 加載環境變量
load_dotenv()

# 添加項目路徑
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "backend" / "src"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json

from api.routers import agent, rules, file_processor, task_memory, sandbox, calendar
from supervisor_agent.core.supervisor_agent import SupervisorAgent
from supervisor_agent.utils.logger import get_logger, setup_logging

# 設置日誌
setup_logging(
    {"level": "INFO", "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"}
)

logger = get_logger(__name__)


# 自定義 JSON 響應類，確保 UTF-8 編碼
class UTF8JSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")


# 創建 FastAPI 應用
app = FastAPI(
    title="Supervisor Agent API",
    description="基於 LangGraph 的智能助手",
    version="1.0.0",
    default_response_class=UTF8JSONResponse,
)

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局 agent 實例
agent_instance = None


@app.on_event("startup")
async def startup_event():
    """應用啟動事件"""
    global agent_instance

    logger.info("🚀 啟動 Supervisor Agent API 服務...")

    try:
        # 初始化 Agent
        rules_dir = Path(__file__).parent.parent / "data" / "rules"
        from supervisor_agent.core.supervisor_agent import SupervisorAgent

        agent_instance = SupervisorAgent(str(rules_dir))

        # 將 agent 實例存儲到應用狀態和路由
        app.state.agent = agent_instance
        from api.routers.agent import set_agent

        set_agent(agent_instance)

        logger.info("✅ Supervisor Agent 初始化完成")

    except Exception as e:
        logger.error(f"❌ 啟動失敗: {e}")


# 註冊路由
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(rules.router, prefix="/api/rules", tags=["rules"])
app.include_router(file_processor.router, prefix="/api/file", tags=["file_processor"])
app.include_router(task_memory.router, prefix="/api/task", tags=["task_memory"])
app.include_router(sandbox.router, prefix="/api/sandbox", tags=["sandbox"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])


@app.get("/")
async def root():
    """根路徑"""
    return {
        "message": "Supervisor Agent API",
        "version": "1.0.0",
        "endpoints": {
            "stream": "/api/agent/stream",
            "rules": "/api/rules",
            "health": "/health",
        },
    }


@app.get("/health")
async def health_check():
    """健康檢查"""
    try:
        if agent_instance:
            # 檢查規則目錄中的規則文件
            from pathlib import Path
            import json
            
            rules_dir = Path(agent_instance.rules_dir)
            rules = []
            if rules_dir.exists():
                for rule_file in rules_dir.glob("*.json"):
                    try:
                        with open(rule_file, "r", encoding="utf-8") as f:
                            rule_data = json.load(f)
                            rules.append(rule_data.get("name", rule_file.stem))
                    except Exception as e:
                        logger.warning(f"⚠️ 讀取規則文件失敗 {rule_file.name}: {e}")
                        
            return {
                "status": "healthy",
                "agent_initialized": True,
                "rules_count": len(rules),
                "available_rules": rules,
            }
        else:
            return {
                "status": "unhealthy",
                "agent_initialized": False,
                "error": "Agent not initialized",
            }
    except Exception as e:
        logger.error(f"健康檢查失敗: {e}")
        return {"status": "unhealthy", "error": str(e)}


if __name__ == "__main__":
    import uvicorn

    # 檢查規則目錄
    # rules_dir = Path(__file__).parent.parent / "data" / "rules"
    # if rules_dir.exists():
    #     rule_files = list(rules_dir.glob("*.json"))
    #     logger.info(f"✅ 找到 {len(rule_files)} 個規則文件")

    uvicorn.run(app, host="0.0.0.0", port=8021, reload=False, log_level="info")
