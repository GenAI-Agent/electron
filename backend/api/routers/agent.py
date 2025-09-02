"""
Agent API 路由

處理與 Agent 相關的請求，只提供流式接口。
"""

import json
import numpy as np
from typing import AsyncGenerator, Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from supervisor_agent.core.supervisor_agent import SupervisorAgent

# 添加 src 目錄到路徑以導入工具
import os
import sys
from pathlib import Path

current_dir = Path(__file__).parent
src_dir = current_dir.parent.parent / "src"
sys.path.insert(0, str(src_dir))

# 導入 LangChain 兼容的本地文件工具
from supervisor_agent.tools.langchain_local_file_tools import (
    get_langchain_local_file_tools,
)
from supervisor_agent.utils.logger import get_logger

logger = get_logger(__name__)


def convert_numpy_types(obj):
    """
    遞歸轉換numpy類型為Python原生類型，解決JSON序列化問題
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    else:
        return obj


def compress_tool_result(tool_result: dict, max_data_items: int = 5) -> dict:
    """
    壓縮工具結果，避免對話歷史過長

    Args:
        tool_result: 工具執行結果
        max_data_items: 最大保留的數據項目數量

    Returns:
        壓縮後的結果
    """
    if not isinstance(tool_result, dict):
        return tool_result

    compressed = tool_result.copy()

    # 壓縮大數據量字段
    for key in ["data", "filtered_data", "sample_data", "results"]:
        if key in compressed and isinstance(compressed[key], list):
            original_length = len(compressed[key])
            if original_length > max_data_items:
                compressed[key] = compressed[key][:max_data_items]
                compressed[f"{key}_truncated"] = True
                compressed[f"{key}_original_count"] = original_length
                compressed[f"{key}_truncated_message"] = (
                    f"數據已截斷，原有 {original_length} 項，只顯示前 {max_data_items} 項"
                )

    # 移除或壓縮其他大字段
    large_fields_to_remove = ["raw_data", "full_results", "detailed_analysis"]
    for field in large_fields_to_remove:
        if field in compressed:
            compressed[f"{field}_removed"] = f"大字段 {field} 已移除以節省空間"
            del compressed[field]

    return compressed


def _determine_request_type(context_data: dict) -> str:
    """
    判斷請求類型

    Args:
        context_data: 上下文數據

    Returns:
        請求類型: 'multi_file', 'file', 'local_file', 'web', 'gmail'
    """
    if not context_data:
        return "local_file"

    type = context_data.get("type")

    # 詳細記錄判斷過程
    print(f"🔍 _determine_request_type 判斷過程:")
    # print(f"  - context_data: {context_data}")
    # print(f"  - context_data keys: {list(context_data.keys()) if context_data else 'None'}")
    print(f"  - type: {type}")

    logger.info(f"🔍 判斷請求類型:")
    logger.info(f"  - context_data keys: {list(context_data.keys())}")
    logger.info(f"  - type: {type}")

    # 判斷是否為多檔案類型
    if type == "multi_file":
        files = context_data.get("files", [])
        print(f"  - 檢測到 multi_file 類型，檔案數量: {len(files)}")
        logger.info(f"  - 檢測到 multi_file 類型，檔案數量: {len(files)}")
        return "multi_file"
    elif type == "file":
        file_path = context_data.get("file_path")
        print(f"  - 檢測到 file 類型，檔案路徑: {file_path}")
        logger.info(f"  - 檢測到 file 類型，檔案路徑: {file_path}")
        return "file"
    elif type == "gmail" or context_data.get("email_address"):
        print(f"  - 檢測到 gmail 類型")
        logger.info(f"  - 檢測到 gmail 類型")
        return "gmail"
    elif type == "web" or type == "page":
        print(f"  - 檢測到 web 類型")
        logger.info(f"  - 檢測到 web 類型")
        return "web"
    else:
        print(f"  - 預設為 local_file 類型")
        logger.info(f"  - 預設為 local_file 類型")
        return "local_file"


# 移除 session summary 相關函數

router = APIRouter()


# Session-based Agent 管理
class AgentManager:
    """Agent管理器，為每個session維護獨立的agent實例"""

    def __init__(self):
        self.agents: Dict[str, SupervisorAgent] = {}
        # 從 backend/api/routers/agent.py 到 data/rules 的正確路徑
        self.rules_dir = Path(__file__).parent.parent.parent.parent / "data" / "rules"
        logger.info(f"📁 AgentManager rules_dir: {self.rules_dir}")
        logger.info(f"📁 rules_dir 是否存在: {self.rules_dir.exists()}")
        if self.rules_dir.exists():
            rule_files = list(self.rules_dir.glob("*.json"))
            logger.info(f"📁 找到的 rule 文件: {[f.name for f in rule_files]}")

    def get_agent(self, session_id: str, stream_callback=None) -> SupervisorAgent:
        """獲取指定session的Agent實例"""
        if session_id not in self.agents:
            logger.info(f"🆕 為session {session_id} 創建新的Agent實例")
            self.agents[session_id] = SupervisorAgent(
                str(self.rules_dir), stream_callback
            )
        else:
            # 更新現有agent的stream_callback
            self.agents[session_id].stream_callback = stream_callback
        return self.agents[session_id]

    def cleanup_agent(self, session_id: str):
        """清理指定session的Agent實例"""
        if session_id in self.agents:
            logger.info(f"🗑️ 清理session {session_id} 的Agent實例")
            del self.agents[session_id]

    def get_active_sessions(self) -> List[str]:
        """獲取活躍的session列表"""
        return list(self.agents.keys())


# 全域Agent管理器實例
_agent_manager = AgentManager()


def get_agent(session_id: str = "default", stream_callback=None) -> SupervisorAgent:
    """獲取指定session的Agent實例"""
    return _agent_manager.get_agent(session_id, stream_callback)


def set_agent(agent: SupervisorAgent, session_id: str = "default"):
    """設置指定session的Agent實例"""
    _agent_manager.agents[session_id] = agent
    logger.info(f"✅ Session {session_id} 的Agent實例已設置")


class StreamRequest(BaseModel):
    """流式請求模型"""

    message: str = Field(..., description="用戶消息")
    user_id: str = Field(default="default_user", description="用戶ID")
    session_id: str = Field(default="default_session", description="會話ID")
    context_data: Optional[Dict[str, Any]] = Field(
        default=None, description="上下文資料（頁面或文件）"
    )


async def generate_stream_response(
    message: str,
    agent: SupervisorAgent,
    session_id: str = "default_session",
    context_data: dict = None,
    request_type: str = "default",
) -> AsyncGenerator[str, None]:
    """生成流式響應"""

    # 用於存儲stream事件的列表
    stream_events = []

    # 定義stream回調函數
    async def stream_callback(event_data):
        """收集工具執行結果"""
        stream_events.append(event_data)

    try:
        logger.info(f"🚀 開始生成流式響應")
        logger.info(f"  - message: {message}")
        logger.info(f"  - session_id: {session_id}")
        logger.info(f"  - request_type: {request_type}")

        # 詳細記錄 context_data
        if context_data:
            logger.info(f"📋 Context Data 詳細資訊:")
            logger.info(f"  - keys: {list(context_data.keys())}")
            logger.info(f"  - type: {context_data.get('type')}")

            if context_data.get("type") == "multi_file":
                files = context_data.get("files", [])
                logger.info(f"  - 多檔案數量: {len(files)}")
                for i, file_info in enumerate(files):
                    logger.info(
                        f"    檔案 {i+1}: {file_info.get('filename')} ({len(file_info.get('data', []))} 行)"
                    )
            elif context_data.get("type") == "file":
                logger.info(f"  - 單檔案路徑: {context_data.get('file_path')}")
        else:
            logger.info(f"📋 Context Data: None")

        # 🎯 根據請求類型選擇工具集和處理方式
        available_tools = []
        file_summary = None
        final_context = None

        if request_type == "local_file":
            logger.info("📁 LOCAL FILE 模式 - 直接處理文件")
            available_tools = get_langchain_local_file_tools()

            # 🔄 **處理單檔案或多檔案**
            if context_data and (
                context_data.get("file_path") or context_data.get("file_paths")
            ):
                # 支持單檔案路徑
                if context_data.get("file_path"):
                    file_path = context_data.get("file_path")
                    file_paths = [file_path]
                    logger.info(f"📄 處理單個文件: {file_path}")
                    print(f"📄 處理單個文件: {file_path}")
                # 支持多檔案路徑
                elif context_data.get("file_paths"):
                    file_paths = context_data.get("file_paths")
                    file_path = file_paths[0]  # 向後兼容，使用第一個檔案作為主檔案
                    logger.info(f"📁 處理多個文件: {len(file_paths)} 個檔案")
                    logger.info(f"📁 檔案列表: {file_paths}")
                    print(f"📁 處理多個文件: {len(file_paths)} 個檔案")
                    print(f"📁 檔案列表: {file_paths}")

                # 🔧 **導入必要的模組**
                from pathlib import Path
                import os

                # 🎯 根據檔案數量決定傳遞給 Agent 的 context
                if len(file_paths) > 1:
                    # 多檔案：先讀取所有檔案，然後傳遞預處理的數據給 Agent
                    logger.info(f"✅ 多檔案模式：先讀取 {len(file_paths)} 個檔案")
                    print(f"✅ 多檔案模式：先讀取 {len(file_paths)} 個檔案")
                    print(f"📁 檔案列表: {file_paths}")

                    try:
                        # 🔧 直接調用多檔案讀取函數（繞過 LangChain 工具包裝）
                        # 導入原始函數而不是工具對象
                        import sys
                        import os

                        sys.path.append(
                            os.path.join(os.path.dirname(__file__), "..", "..")
                        )

                        # 🔧 使用與 local file 相同的數據分析工具進行摘要化處理
                        from src.tools.data_analysis_tools import data_analysis_tools

                        print(f"📤 多檔案摘要化處理，檔案數量: {len(file_paths)}")

                        # 並行處理多個檔案的摘要
                        import asyncio

                        async def process_single_file(file_path):
                            try:
                                print(f"📄 處理檔案摘要: {file_path}")

                                # 🔧 識別平台類型
                                filename = file_path.split("/")[-1].lower()
                                if "thread" in filename:
                                    platform_type = "社群討論串"
                                    platform_name = "Threads"
                                elif "ptt" in filename:
                                    platform_type = "PTT論壇"
                                    platform_name = "PTT"
                                elif "facebook" in filename or "fb" in filename:
                                    platform_type = "社群媒體"
                                    platform_name = "Facebook"
                                elif "twitter" in filename:
                                    platform_type = "社群媒體"
                                    platform_name = "Twitter"
                                elif "petition" in filename:
                                    platform_type = "陳情系統"
                                    platform_name = "Petition"
                                elif "marketing_dashboard" in filename:
                                    platform_type = "營運儀表板"
                                    platform_name = "Marketing Dashboard"
                                elif "marketing_strategy" in filename:
                                    platform_type = "策略推演"
                                    platform_name = "Strategy Simulation"
                                elif "marketing_action" in filename:
                                    platform_type = "行動建議"
                                    platform_name = "Action Recommendation"
                                elif "marketing_intelligence" in filename:
                                    platform_type = "智庫"
                                    platform_name = "Intelligence Hub"
                                elif "marketing_competitor" in filename:
                                    platform_type = "競爭者分析"
                                    platform_name = "Competitor Analysis"
                                elif "marketing_complaints" in filename:
                                    platform_type = "客訴分析"
                                    platform_name = "Complaints Analysis"
                                elif "marketing_china_airlines" in filename:
                                    platform_type = "華航企業資料"
                                    platform_name = "China Airlines Data"
                                else:
                                    platform_type = "未知平台"
                                    platform_name = "Unknown"

                                print(f"🏷️ 識別平台: {platform_name} ({platform_type})")

                                # 使用 data_analysis_tools 獲取檔案摘要（與 local file 相同的方式）
                                data_info_result = (
                                    await data_analysis_tools.get_data_info(
                                        file_path, session_id
                                    )
                                )

                                if isinstance(
                                    data_info_result, dict
                                ) and data_info_result.get("success", True):
                                    # 添加平台識別信息
                                    enhanced_result = {
                                        "filename": file_path,
                                        "platform_name": platform_name,
                                        "platform_type": platform_type,
                                        "success": True,
                                        "data_summary": data_info_result,  # 摘要化的數據信息
                                        "sample_data": data_info_result.get(
                                            "sample_data", []
                                        )[
                                            :1
                                        ],  # 只保留1行樣本用於格式參考
                                        "total_rows": data_info_result.get(
                                            "total_rows", 0
                                        ),
                                        "columns": data_info_result.get("columns", []),
                                    }
                                    print(
                                        f"✅ 成功處理摘要: {file_path} ({platform_name}, {data_info_result.get('total_rows', 0)} 行)"
                                    )
                                    return enhanced_result
                                else:
                                    print(f"❌ 摘要處理失敗: {file_path}")
                                    return {
                                        "filename": file_path,
                                        "platform_name": platform_name,
                                        "platform_type": platform_type,
                                        "success": False,
                                        "error": "數據摘要處理失敗",
                                    }

                            except Exception as e:
                                print(f"❌ 處理異常: {file_path} - {e}")
                                return {
                                    "filename": file_path,
                                    "success": False,
                                    "error": str(e),
                                }

                        # 並行處理所有檔案
                        results = await asyncio.gather(
                            *[process_single_file(fp) for fp in file_paths]
                        )
                        successful_files = [r for r in results if r.get("success")]

                        print(
                            f"📊 摘要處理完成: {len(successful_files)}/{len(file_paths)} 成功"
                        )

                        # 構建多檔案摘要統計
                        platforms = list(
                            set(
                                r.get("platform_name", "Unknown")
                                for r in successful_files
                            )
                        )
                        platform_types = list(
                            set(
                                r.get("platform_type", "未知平台")
                                for r in successful_files
                            )
                        )

                        summary = {
                            "total_files": len(file_paths),
                            "successful_reads": len(successful_files),
                            "failed_reads": len(file_paths) - len(successful_files),
                            "total_rows": sum(
                                r.get("total_rows", 0) for r in successful_files
                            ),
                            "platforms": platforms,
                            "platform_types": platform_types,
                            "analysis_context": f"比較分析 {' vs '.join(platform_types)} 的數據差異",
                        }

                        print(f"📋 識別的平台: {platforms}")
                        print(f"📋 平台類型: {platform_types}")
                        print(f"📋 分析上下文: {summary['analysis_context']}")

                        reader_data = {
                            "success": True,
                            "results": results,
                            "summary": summary,
                            "session_id": session_id,
                        }

                        # 🔧 安全的 JSON 序列化檢查
                        try:
                            reader_result = json.dumps(reader_data, ensure_ascii=False)
                            print(f"✅ JSON 序列化成功")
                        except TypeError as json_error:
                            print(f"❌ JSON 序列化失敗: {json_error}")
                            # 檢查哪個結果有問題
                            for i, result in enumerate(results):
                                try:
                                    json.dumps(result)
                                except TypeError:
                                    print(f"❌ 結果 {i} 無法序列化: {result.keys()}")
                                    # 移除有問題的字段
                                    for key in list(result.keys()):
                                        try:
                                            json.dumps(result[key])
                                        except TypeError:
                                            print(f"❌ 移除無法序列化的字段: {key}")
                                            del result[key]

                            # 重新嘗試序列化
                            reader_result = json.dumps(reader_data, ensure_ascii=False)
                            print(f"✅ 清理後 JSON 序列化成功")

                        print(
                            f"📥 multi_file_reader_tool 結果: {reader_result[:500]}..."
                        )

                        # 解析結果
                        reader_data = json.loads(reader_result)

                        if reader_data.get("success"):
                            # 成功讀取檔案，構建包含摘要數據和平台信息的 context
                            final_context = {
                                "mode": "multi_file_analysis",
                                "total_files": len(file_paths),
                                "file_paths": file_paths,
                                "files_summary": reader_data,  # 摘要化的檔案數據
                                "platforms": summary["platforms"],
                                "platform_types": summary["platform_types"],
                                "analysis_context": summary["analysis_context"],
                                "message": f"已成功分析 {len(successful_files)} 個檔案的摘要：{', '.join(summary['platforms'])}",
                            }
                            print(
                                f"✅ 多檔案摘要分析完成：{summary['analysis_context']}"
                            )
                            logger.info(
                                f"✅ 多檔案摘要分析完成：{summary['analysis_context']}"
                            )
                        else:
                            # 讀取失敗
                            error_msg = reader_data.get("error", "多檔案讀取失敗")
                            print(f"❌ 多檔案讀取失敗: {error_msg}")
                            final_context = {"error": f"多檔案讀取失敗: {error_msg}"}

                    except Exception as e:
                        print(f"❌ 多檔案預處理失敗: {e}")
                        logger.error(f"❌ 多檔案預處理失敗: {e}")
                        final_context = {"error": f"多檔案預處理失敗: {str(e)}"}
                else:
                    # 單檔案：使用原有邏輯
                    logger.info(f"✅ 單檔案模式：使用原有邏輯處理")
                    print(f"✅ 單檔案模式：使用原有邏輯處理")

                    # 🔧 **修復路徑問題：將相對路徑轉換為絕對路徑**
                    # 如果是相對路徑（如 sandbox/xxx.csv），轉換為絕對路徑
                    if file_path.startswith("sandbox/"):
                        # 獲取項目根目錄：backend/api/routers/agent.py -> backend/api/routers -> backend/api -> backend -> project_root
                        current_dir = Path(
                            __file__
                        ).parent.parent.parent.parent  # 正確的路徑層級
                        absolute_file_path = current_dir / "data" / file_path
                        logger.info(f"🔧 路徑轉換: {file_path} -> {absolute_file_path}")
                        print(f"🔧 路徑轉換: {file_path} -> {absolute_file_path}")
                        file_path = str(absolute_file_path)

                    # 繼續單檔案處理邏輯...

                    # 檢查是否為合併資料集的虛擬路徑
                    if file_path.endswith("combined_datasets"):
                        logger.info(f"🔄 處理合併資料集: {file_path}")
                        # 對於合併資料集，直接使用context_data中的資料
                        if context_data and "file_summary" in context_data:
                            final_context = {
                                "file_path": file_path,
                                "data_info": context_data["file_summary"],
                                "is_combined_dataset": True,
                            }
                            logger.info(
                                f"✅ 成功處理合併資料集，包含 {len(context_data['file_summary'].get('segments', []))} 個資料集"
                            )
                        else:
                            logger.error(f"❌ 合併資料集缺少必要的上下文資料")
                            final_context = {
                                "error": f"合併資料集缺少上下文資料: {file_path}"
                            }
                    # 檢查實體文件是否存在
                    elif not Path(file_path).exists():
                        logger.error(f"❌ 文件不存在: {file_path}")
                        final_context = {"error": f"文件不存在: {file_path}"}
                    else:
                        # 直接調用底層的數據分析函數獲取數據信息
                        from src.tools.data_analysis_tools import data_analysis_tools

                        try:
                            data_info_result = await data_analysis_tools.get_data_info(
                                file_path, session_id
                            )
                            logger.info(
                                f"📊 get_data_info_tool 執行結果: {str(data_info_result)[:500]}..."
                            )

                            # 構建 final_context，只包含 data_info
                            final_context = {
                                "file_path": file_path,
                                "data_info": data_info_result,
                            }

                            # 詳細記錄傳給 agent 的內容
                            logger.info("📋 傳給 Agent 的 final_context 內容:")
                            logger.info(f"  - file_path: {final_context['file_path']}")
                            logger.info(
                                f"  - data_info 類型: {type(final_context['data_info'])}"
                            )

                            if isinstance(data_info_result, dict):
                                # 記錄 data_info 的關鍵信息
                                sample_data = data_info_result.get("sample_data", [])
                                total_rows = data_info_result.get("total_rows", 0)
                                columns = data_info_result.get("columns", [])

                                logger.info(f"  - sample_data 數量: {len(sample_data)}")
                                logger.info(f"  - total_rows: {total_rows}")
                                logger.info(f"  - columns: {columns}")
                                logger.info(f"  - sample_data 內容: {sample_data}")

                                # 確保有 sample_data
                                if sample_data:
                                    logger.info("✅ 成功獲取 sample_data，將傳給 Agent")
                                else:
                                    logger.warning("⚠️ sample_data 為空")

                        except Exception as e:
                            logger.error(f"❌ 處理文件失敗: {e}")
                            final_context = {"error": f"文件處理失敗: {str(e)}"}
            else:
                logger.error("❌ 沒有提供 file_path")
                logger.error(f"❌ 完整的 context_data: {context_data}")

                # 🚫 直接返回錯誤，不讓 Agent 繼續執行
                error_message = (
                    "請先在 AI Sandbox 頁面選擇要分析的資料集，然後再提出分析問題。"
                )

                # 直接返回錯誤響應，不調用 Agent
                yield f"data: {json.dumps({'type': 'error', 'message': error_message}, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps({'type': 'content', 'content': error_message}, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
                return

        elif request_type == "gmail":
            logger.info("📧 GMAIL 模式 - 批量抓取郵件並轉換為 local file 處理")

            # 提取 Gmail 相關信息
            email_address = context_data.get("email_address", "")
            oauth_tokens = context_data.get("oauth_tokens", {})
            access_token = oauth_tokens.get("access_token", "")

            if not access_token:
                logger.error("❌ 缺少 OAuth access token")
                raise ValueError("Gmail 模式需要 OAuth access token")

            logger.info(f"📧 開始抓取 Gmail 郵件: {email_address}")

            # 調用 Gmail 批量抓取工具
            from src.tools.gmail_tools import fetch_gmail_emails_batch

            gmail_result = await fetch_gmail_emails_batch(
                access_token=access_token,
                email_address=email_address,
                total_emails=500,
                session_id=session_id,
            )

            if not gmail_result.get("success"):
                logger.error(f"❌ Gmail 抓取失敗: {gmail_result.get('error')}")
                raise ValueError(f"Gmail 抓取失敗: {gmail_result.get('error')}")

            csv_path = gmail_result.get("csv_path")
            logger.info(f"✅ Gmail 數據已保存到: {csv_path}")
            logger.info(f"📊 抓取了 {gmail_result.get('total_emails')} 封郵件")

            # 🔄 **重新設置為 file 模式，讓它走完整的 local file 處理流程**
            logger.info("🔄 Gmail 抓取完成，轉換為 local file 模式處理...")

            # 重新設置 context_data 和 request_type
            context_data = {
                "type": "file",
                "file_path": csv_path,
                # 保留 Gmail 相關信息
                "original_query": message,
                "email_address": email_address,
                "gmail_metadata": {
                    "total_emails": gmail_result.get("total_emails"),
                    "successful_batches": gmail_result.get("successful_batches"),
                    "failed_batches": gmail_result.get("failed_batches"),
                },
            }
            request_type = "file"

            logger.info(f"📊 已轉換為 file 模式，將重新處理:")
            logger.info(f"  - 文件路徑: {csv_path}")
            logger.info(f"  - 新的 request_type: {request_type}")

            # 🔄 **重新模擬 local file 請求，走完整的 local file 處理流程**
            logger.info("🔄 Gmail 模式轉換為 local file 模式，重新處理...")

            # 🔄 **重新走 local file 的完整處理邏輯**
            logger.info("📄 重新處理 Gmail CSV 文件，獲取 data_info...")

            # 直接調用底層的數據分析函數獲取數據信息（和 local file 模式一樣）
            from src.tools.data_analysis_tools import data_analysis_tools

            try:
                data_info_result = await data_analysis_tools.get_data_info(
                    csv_path, session_id
                )
                logger.info(
                    f"📊 get_data_info_tool 執行結果: {str(data_info_result)[:500]}..."
                )

                # 構建 final_context，和 local file 模式完全一樣
                final_context = {
                    "file_path": csv_path,
                    "data_info": data_info_result,
                    # 保留 Gmail 相關的額外信息
                    "original_query": message,
                    "email_address": email_address,
                    "gmail_metadata": {
                        "total_emails": gmail_result.get("total_emails"),
                        "successful_batches": gmail_result.get("successful_batches"),
                        "failed_batches": gmail_result.get("failed_batches"),
                    },
                }

                # 使用 local file 工具集
                available_tools = get_langchain_local_file_tools()

                logger.info("� Gmail 模式已完全轉換為 local file 處理模式:")
                logger.info(f"  - 文件路徑: {csv_path}")
                logger.info(f"  - 郵件數量: {gmail_result.get('total_emails')}")
                logger.info(f"  - data_info 類型: {type(final_context['data_info'])}")

            except Exception as e:
                logger.error(f"❌ 處理 Gmail CSV 文件失敗: {e}")
                raise ValueError(f"Gmail 數據處理失敗: {e}")

        elif request_type == "multi_file":
            print("📊 MULTI_FILE 模式 - 處理多個資料集")
            logger.info("📊 MULTI_FILE 模式 - 處理多個資料集")

            # 從前端傳來的多檔案資料
            files = context_data.get("files", [])
            total_files = context_data.get("total_files", 0)

            print(f"📊 處理 {total_files} 個檔案")
            print(f"📊 檔案詳細資訊:")
            for i, file_info in enumerate(files):
                print(f"  檔案 {i+1}: {file_info}")

            logger.info(f"📊 處理 {total_files} 個檔案")

            # 直接讀取現有的 CSV 檔案
            import pandas as pd
            import os
            from pathlib import Path

            created_files = []

            for file_info in files:
                source = file_info.get("source")
                filename = file_info.get("filename")
                file_path = file_info.get("file_path")

                if not file_path:
                    logger.warning(f"⚠️ 檔案 {filename} 沒有提供路徑")
                    continue

                # 檢查檔案是否存在，處理相對路徑
                if file_path.startswith("../"):
                    # 相對於 backend/ 的路徑
                    full_path = Path(file_path)
                elif file_path.startswith("data/"):
                    # 相對於項目根目錄的路徑
                    full_path = Path("..") / file_path
                else:
                    # 絕對路徑或其他情況
                    full_path = Path(file_path)

                logger.info(f"🔍 檢查檔案路徑: {file_path} -> {full_path.absolute()}")

                if not full_path.exists():
                    logger.error(f"❌ 檔案不存在: {full_path.absolute()}")
                    continue

                try:
                    # 讀取完整的 CSV 檔案
                    df = pd.read_csv(full_path, encoding="utf-8-sig")

                    print(f"✅ 成功讀取檔案: {full_path}")
                    print(f"   - 來源: {source}")
                    print(f"   - 檔名: {filename}")
                    print(f"   - 行數: {len(df)}")
                    print(f"   - 欄位數: {len(df.columns)}")
                    print(f"   - 欄位名稱: {list(df.columns)}")
                    print(f"   - 前3行資料:")
                    print(df.head(3).to_string())

                    created_files.append(
                        {
                            "source": source,
                            "filename": filename,
                            "file_path": str(full_path),
                            "row_count": len(df),
                            "columns": list(df.columns),
                        }
                    )

                    logger.info(
                        f"✅ 讀取檔案: {full_path} ({len(df)} 行, {len(df.columns)} 列)"
                    )
                    logger.info(f"   欄位: {list(df.columns)}")

                except Exception as e:
                    print(f"❌ 讀取檔案失敗 {filename}: {e}")
                    logger.error(f"❌ 讀取檔案失敗 {filename}: {e}")
                    continue

            if not created_files:
                raise ValueError("沒有成功建立任何檔案")

            # 構建 final_context，包含所有檔案的路徑
            final_context = {
                "type": "multi_file",
                "files": created_files,
                "total_files": len(created_files),
                "session_id": session_id,
            }

            # 使用 local file 工具集
            available_tools = get_langchain_local_file_tools()

            logger.info(f"✅ 多檔案模式設置完成:")
            logger.info(f"  - 建立檔案數量: {len(created_files)}")
            for file_info in created_files:
                logger.info(
                    f"  - {file_info['source']}: {file_info['file_path']} ({file_info['row_count']} 行)"
                )

        elif request_type == "web":
            logger.info("🌐 WEB 模式 - 使用 Web Tools")
            # TODO: 添加 Web Tools
            available_tools = []  # 暫時為空，等待實現 Web Tools
            final_context = context_data
            logger.info(
                f"  - 使用上下文: {json.dumps(final_context, ensure_ascii=False, indent=2)}"
            )

        else:
            logger.info("🔧 DEFAULT 模式 - 使用默認工具集")
            available_tools = get_langchain_local_file_tools()
            final_context = context_data
            if final_context:
                logger.info(
                    f"  - 使用上下文: {json.dumps(final_context, ensure_ascii=False, indent=2)}"
                )
            else:
                logger.info(f"  - 無上下文數據")

        logger.info(f"🔧 選擇的工具數量: {len(available_tools)}")

        # 發送開始事件
        if request_type == "local_file":
            start_event = {
                "type": "start",
                "message": "📁 Local File 模式：文件預處理已完成，開始分析...",
            }
        elif request_type == "gmail":
            start_event = {
                "type": "start",
                "message": f"📧 Gmail 模式：已成功抓取 {final_context.get('gmail_metadata', {}).get('total_emails', 0)} 封郵件，開始分析...",
            }
        elif request_type == "web":
            start_event = {
                "type": "start",
                "message": "🌐 Web 模式：開始處理網頁內容...",
            }
        else:
            start_event = {
                "type": "start",
                "message": "🔧 Default 模式：開始處理任務...",
            }

        yield f"data: {json.dumps(start_event, ensure_ascii=False)}\n\n"

        # 解析規則
        rule_name = None
        query = message
        logger.info(f"🔍 開始解析規則:")
        logger.info(f"  - 原始 message: '{message}'")
        logger.info(f"  - message.startswith('/'): {message.startswith('/')}")

        if message.startswith("/"):
            parts = message[1:].split(" ", 1)
            logger.info(f"  - 分割後的 parts: {parts}")
            logger.info(f"  - parts 長度: {len(parts)}")
            if len(parts) >= 1:
                rule_name = parts[0]
                query = parts[1] if len(parts) > 1 else ""
                logger.info(f"  - 解析出的 rule_name: '{rule_name}'")
                logger.info(f"  - 解析出的 query: '{query}'")

        logger.info(f"🎯 最終解析結果:")
        logger.info(f"  - rule_name: '{rule_name}'")
        logger.info(f"  - query: '{query}'")

        if rule_name:
            rule_event = {
                "type": "rule",
                "rule_name": rule_name,
                "message": f"使用規則: {rule_name}",
            }
            yield f"data: {json.dumps(rule_event, ensure_ascii=False)}\n\n"

        # 發送處理事件
        processing_event = {"type": "processing", "message": "正在執行任務..."}
        yield f"data: {json.dumps(processing_event, ensure_ascii=False)}\n\n"

        # 🎯 **關鍵步驟：傳遞預處理後的上下文給 SupervisorAgent**
        logger.info("🔄 步驟2: 準備上下文數據傳遞給 SupervisorAgent")

        context = (
            {
                "session_id": session_id,
                "context_data": final_context,  # 這裡已經包含了 file_summary
                "current_time": __import__("datetime").datetime.now().isoformat(),
            }
            if final_context
            else {
                "session_id": session_id,
                "current_time": __import__("datetime").datetime.now().isoformat(),
            }
        )

        # 檢查是否有文件 summary（應該已經在 final_context 中）
        if final_context and final_context.get("file_summary"):
            logger.info(f"📋 確認：文件 Summary 已包含在 context_data 中")
            logger.info(
                f"📋 Summary 類型: {final_context['file_summary'].get('type', 'unknown')}"
            )
        elif file_summary:
            # 備用方案：直接添加到 context
            context["file_summary"] = file_summary
            logger.info(f"📋 備用：文件 Summary 已直接添加到 context")

        # 將工具名稱列表傳遞給 Agent，而不是函數對象
        tool_names = [tool.name for tool in available_tools]
        context["available_tool_names"] = tool_names

        logger.info(
            f"🔄 步驟3: 準備調用 SupervisorAgent，工具數量: {len(available_tools)}"
        )

        # 獲取agent實例並設置stream回調
        agent = get_agent(session_id, stream_callback)

        # 執行agent，stream回調會自動處理工具執行結果
        result = await agent.run(
            query, rule_id=rule_name, context=context, available_tools=available_tools
        )

        # 轉換numpy類型以避免序列化問題
        result = convert_numpy_types(result)

        # 發送所有工具執行事件（壓縮後）
        for event_data in stream_events:
            if event_data["type"] == "tool_result":
                # 壓縮工具結果
                compressed_result = compress_tool_result(event_data["wrapped_result"])

                tool_event = {
                    "type": "tool_execution",
                    "tool_name": event_data["tool_name"],
                    "parameters": event_data["parameters"],
                    "execution_time": event_data["execution_time"],
                    "result": compressed_result,
                }
                tool_event = convert_numpy_types(tool_event)
                yield f"data: {json.dumps(tool_event, ensure_ascii=False)}\n\n"

        # 發送工具使用事件
        tools_used = result.get("tools_used", [])
        if tools_used:
            tools_event = {
                "type": "tools",
                "message": f'使用了工具: {", ".join(tools_used)}',
            }
            tools_event = convert_numpy_types(tools_event)
            yield f"data: {json.dumps(tools_event, ensure_ascii=False)}\n\n"

        # 發送內容事件
        content_event = {
            "type": "content",
            "content": result.get("response", ""),
            "execution_time": result.get("execution_time", 0),
            "tools_used": tools_used,
        }
        content_event = convert_numpy_types(content_event)
        yield f"data: {json.dumps(content_event, ensure_ascii=False)}\n\n"

        # 發送完成事件
        complete_event = {
            "type": "complete",
            "message": "任務執行完成",
            "success": result.get("success", True),
        }
        complete_event = convert_numpy_types(complete_event)
        yield f"data: {json.dumps(complete_event, ensure_ascii=False)}\n\n"

    except Exception as e:
        logger.error(f"流式響應生成失敗: {e}")
        error_event = {"type": "error", "message": f"處理失敗: {str(e)}"}
        json_str = json.dumps(error_event, ensure_ascii=False)
        yield f"data: {json_str}\n\n"

    finally:
        # 發送結束標記
        yield "data: [DONE]\n\n"


@router.post("/stream")
async def stream_chat(request: StreamRequest):
    """流式聊天接口"""
    try:
        print(f"🚀 收到流式聊天請求: {request.message[:100]}...")
        print(f"  - user_id: {request.user_id}")
        print(f"  - session_id: {request.session_id}")

        logger.info(f"收到流式聊天請求: {request.message[:100]}...")
        logger.info(f"  - user_id: {request.user_id}")

        # 完整輸出 context_data - 使用 logger 而不是 print
        logger.info(f"📋 完整 context_data:")
        logger.info(f"  - type: {type(request.context_data)}")
        logger.info(f"  - content: {request.context_data}")
        print(f"📋 完整 context_data:")
        print(f"  - type: {type(request.context_data)}")
        print(f"  - content: {request.context_data}")

        if request.context_data:
            print(f"  - keys: {list(request.context_data.keys())}")
            for key, value in request.context_data.items():
                print(f"    {key}: {type(value)} = {value}")

                # 🔍 特別檢查 files 和 file_paths
                if key in ["files", "file_paths", "file_summary"] and value:
                    print(f"    📁 {key} 詳細內容:")
                    if isinstance(value, list):
                        for i, item in enumerate(value):
                            print(f"      [{i}]: {type(item)} = {item}")
                            if isinstance(item, dict):
                                for sub_key, sub_value in item.items():
                                    print(f"        {sub_key}: {sub_value}")
                    elif isinstance(value, dict):
                        for sub_key, sub_value in value.items():
                            print(f"      {sub_key}: {type(sub_value)} = {sub_value}")
                            if sub_key == "data_schema" and isinstance(sub_value, dict):
                                print(f"        data_schema 內容:")
                                for schema_key, schema_value in sub_value.items():
                                    print(
                                        f"          {schema_key}: {type(schema_value)} = {schema_value}"
                                    )
        else:
            print("⚠️ context_data 為空或 None")

        # 限制 context_data 日誌輸出長度
        context_str = str(request.context_data)
        if len(context_str) > 300:
            context_str = context_str[:300] + "..."
        logger.info(f"  - context_data: {context_str}")

        # 🔍 判斷請求類型並選擇對應的處理方式
        request_type = _determine_request_type(request.context_data)
        print(f"🎯 判斷的請求類型: {request_type}")
        logger.info(f"🎯 請求類型: {request_type}")

        return StreamingResponse(
            generate_stream_response(
                request.message,
                None,
                request.session_id,
                request.context_data,
                request_type,
            ),
            media_type="text/event-stream; charset=utf-8",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*",
            },
        )

    except Exception as e:
        logger.error(f"流式聊天失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_agent_status():
    """獲取 Agent 狀態"""
    try:
        agent = get_agent()
        rules = agent.parser.list_rules()

        return {
            "status": "running",
            "rules_count": len(rules),
            "available_rules": rules,
        }
    except Exception as e:
        logger.error(f"獲取狀態失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))
