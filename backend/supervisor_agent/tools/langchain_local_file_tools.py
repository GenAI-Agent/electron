"""
LangChain 兼容的本地文件工具
提供標準的 LangChain tool 格式
"""

import logging
import sys
from pathlib import Path
from typing import Dict, Any, List
from langchain_core.tools import tool
from pydantic import Field
import json

# 添加 src 目錄到路徑以導入工具
current_dir = Path(__file__).parent
src_dir = current_dir.parent.parent / "src"
sys.path.insert(0, str(src_dir))

# 導入原始工具函數
from src.tools.local_file_tools import local_file_tools
from src.tools.data_file_tools import data_file_tools
from src.tools.data_analysis_tools import data_analysis_tools

# 導入會話數據管理器
import sys
from pathlib import Path

core_dir = Path(__file__).parent.parent / "core"
sys.path.insert(0, str(core_dir))
try:
    from supervisor_agent.core.session_data_manager import session_data_manager
except ImportError:
    try:
        from session_data_manager import session_data_manager
    except ImportError:
        # 創建一個簡單的替代品
        class SimpleSessionManager:
            def get_temp_file_path(self, session_id: str, filename: str) -> str:
                from pathlib import Path
                temp_dir = Path("temp") / session_id
                temp_dir.mkdir(parents=True, exist_ok=True)
                return str(temp_dir / filename)
        session_data_manager = SimpleSessionManager()

logger = logging.getLogger(__name__)

# 導入新的工具模組
# 初始化擴展工具函數
get_langchain_task_memory_tools = lambda: []
get_langchain_plotting_tools = lambda: []
get_batch_processor_tools = lambda: []

# 導入 Gmail 專用指紋搜尋工具
try:
    from .fingerprint_search_tool import fingerprint_search_csv
    FINGERPRINT_SEARCH_AVAILABLE = True
    logger.info("✅ Gmail 指紋搜尋工具導入成功")
except Exception as e:
    logger.warning(f"⚠️ Gmail 指紋搜尋工具導入失敗: {e}")
    FINGERPRINT_SEARCH_AVAILABLE = False

# 導入通用指紋搜尋工具
try:
    from .flexible_fingerprint_search_tool import flexible_fingerprint_search_csv
    FLEXIBLE_FINGERPRINT_SEARCH_AVAILABLE = True
    logger.info("✅ 通用指紋搜尋工具導入成功")
except Exception as e:
    logger.warning(f"⚠️ 通用指紋搜尋工具導入失敗: {e}")
    FLEXIBLE_FINGERPRINT_SEARCH_AVAILABLE = False

# 導入多檔案分析工具
try:
    from .multi_file_analysis_tools import (
        multi_file_reader_tool,
        multi_file_filter_tool,
        multi_file_analyzer_tool,
        multi_file_data_analyzer_tool
    )
    MULTI_FILE_TOOLS_AVAILABLE = True
    logger.info("✅ 多檔案分析工具導入成功")
except Exception as e:
    logger.warning(f"⚠️ 多檔案分析工具導入失敗: {e}")
    MULTI_FILE_TOOLS_AVAILABLE = False

# 導入 CSV 格式轉換工具
try:
    src_dir = Path(__file__).parent.parent.parent / "src" / "tools"
    sys.path.insert(0, str(src_dir))
    from csv_format_converter import convert_gmail_csv_format, preview_gmail_csv_conversion
    CSV_CONVERTER_AVAILABLE = True
    logger.info("✅ CSV 格式轉換工具導入成功")
except Exception as e:
    logger.warning(f"⚠️ CSV 格式轉換工具導入失敗: {e}")
    CSV_CONVERTER_AVAILABLE = False

EXTENDED_TOOLS_AVAILABLE = False

try:
    # 使用絕對導入避免相對導入問題
    import importlib.util

    # 跳過task_memory_tools的導入，因為它依賴複雜的外部存儲系統
    # 在簡化版本中，我們專注於核心的文件操作和數據處理功能
    logger.info("⚠️ 跳過Task Memory工具導入（避免複雜依賴）")
    logger.info("⚠️ 跳過Plotting工具導入（專注核心功能）")

    # 動態導入batch_processor_tool
    batch_path = current_dir / "langchain_batch_processor_tool.py"
    if batch_path.exists():
        try:
            spec = importlib.util.spec_from_file_location(
                "batch_processor_tool", batch_path
            )
            batch_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(batch_module)
            get_batch_processor_tools = batch_module.get_batch_processor_tools
            logger.info("✅ Batch Processor工具導入成功")
            EXTENDED_TOOLS_AVAILABLE = True  # 至少batch processor成功了
        except Exception as e:
            logger.warning(f"⚠️ Batch Processor工具導入失敗: {e}")

except Exception as e:
    logger.warning(f"擴展工具導入過程失敗: {e}")


@tool
async def read_file_with_summary_tool(
    file_path: str, session_id: str = "default"
) -> str:
    """
    讀取文件並生成摘要

    Args:
        file_path: 文件路徑
        session_id: 會話ID

    Returns:
        包含文件內容和摘要的JSON字符串
    """
    # 記錄輸入
    logger.info(f"🔧 [read_file_with_summary_tool] 開始執行")
    logger.info(f"📥 輸入參數: file_path='{file_path}', session_id='{session_id}'")

    try:
        # 步驟1: 調用底層工具
        logger.info(f"📋 步驟1: 調用 local_file_tools.read_file_with_summary")
        result = await local_file_tools.read_file_with_summary(file_path, session_id)

        # 步驟2: 處理結果
        logger.info(f"📋 步驟2: 處理工具返回結果")
        result_str = str(result)

        # 記錄輸出
        logger.info(f"📤 輸出結果長度: {len(result_str)} 字符")
        logger.info(f"📤 輸出結果前300字符: {result_str[:300]}")
        logger.info(f"✅ [read_file_with_summary_tool] 執行完成")

        return result_str
    except Exception as e:
        logger.error(f"❌ [read_file_with_summary_tool] 執行失敗: {e}")
        error_result = f'{{"success": false, "error": "{str(e)}"}}'
        logger.info(f"📤 錯誤輸出: {error_result}")
        return error_result


@tool
async def edit_file_by_lines_tool(
    file_path: str,
    start_line: int,
    end_line: int,
    new_content: str,
    session_id: str = "default",
) -> str:
    """
    按行編輯文件

    Args:
        file_path: 文件路徑
        start_line: 開始行號
        end_line: 結束行號
        new_content: 新內容
        session_id: 會話ID

    Returns:
        編輯結果的JSON字符串
    """
    try:
        result = await local_file_tools.edit_file_by_lines(
            file_path, start_line, end_line, new_content, session_id
        )
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        logger.error(f"❌ 編輯文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def get_data_info_tool(file_path: str, session_id: str = "default") -> str:
    """
    智能獲取文件信息 - 自動判斷文件類型並使用相應的處理方式

    Args:
        file_path: 文件路徑
        session_id: 會話ID

    Returns:
        文件信息的JSON字符串
    """
    # 記錄輸入
    logger.info(f"🔧 [get_data_info_tool] 開始執行")
    logger.info(f"📥 輸入參數: file_path='{file_path}', session_id='{session_id}'")
    print(f"DEBUG: get_data_info_tool called with file_path='{file_path}', session_id='{session_id}'")

    try:
        # 步驟1: 檢查是否為合併資料集的虛擬路徑
        import os
        from pathlib import Path

        logger.info(f"📋 步驟1: 檢查文件類型")

        # 移除舊的虛擬路徑處理邏輯，現在直接處理實際檔案

        # 檢查實際文件存在性
        logger.info(f"📋 步驟2: 檢查實際文件是否存在")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        file_size = os.path.getsize(file_path)
        file_ext = Path(file_path).suffix.lower()
        logger.info(f"✓ 文件存在，大小: {file_size} bytes，副檔名: {file_ext}")

        # 步驟3: 判斷文件類型
        logger.info(f"📋 步驟3: 判斷文件類型")
        data_file_extensions = [".csv", ".json", ".xlsx", ".xls", ".parquet"]
        text_file_extensions = [
            ".txt",
            ".md",
            ".py",
            ".js",
            ".html",
            ".css",
            ".xml",
            ".yaml",
            ".yml",
        ]

        if file_ext in data_file_extensions:
            # 數據文件 - 使用數據分析工具
            logger.info(f"📊 識別為數據文件，使用數據分析工具")
            result = await data_analysis_tools.get_data_info(file_path, session_id)

        elif file_ext in text_file_extensions:
            # 文本文件 - 使用文件讀取工具生成摘要
            logger.info(f"📄 識別為文本文件，使用文件讀取工具")
            file_summary = await local_file_tools.read_file_with_summary(
                file_path, session_id
            )

            # 轉換為統一格式
            result = {
                "success": True,
                "file_type": "text_file",
                "file_path": file_path,
                "file_size": file_size,
                "file_extension": file_ext,
                "summary": file_summary,
                "analysis_type": "text_file_summary",
            }

        else:
            # 未知文件類型 - 嘗試作為文本文件處理
            logger.info(f"⚠️ 未知文件類型 {file_ext}，嘗試作為文本文件處理")
            try:
                file_summary = await local_file_tools.read_file_with_summary(
                    file_path, session_id
                )
                result = {
                    "success": True,
                    "file_type": "unknown_text_file",
                    "file_path": file_path,
                    "file_size": file_size,
                    "file_extension": file_ext,
                    "summary": file_summary,
                    "analysis_type": "text_file_summary",
                    "warning": f"未知文件類型 {file_ext}，已作為文本文件處理",
                }
            except Exception as text_error:
                # 完全無法處理
                result = {
                    "success": False,
                    "error": f"無法處理文件類型 {file_ext}，既不是支持的數據格式，也無法作為文本文件讀取: {str(text_error)}",
                    "file_path": file_path,
                    "file_extension": file_ext,
                    "supported_data_formats": data_file_extensions,
                    "supported_text_formats": text_file_extensions,
                }

        # 步驟3: 處理結果
        logger.info(f"📋 步驟3: 處理分析結果")
        result_str = json.dumps(result, ensure_ascii=False)

        # 記錄輸出
        logger.info(f"📤 輸出結果長度: {len(result_str)} 字符")
        if isinstance(result, dict) and result.get("success"):
            if result.get("file_type") == "text_file":
                logger.info(f"📄 文本文件摘要已生成")
            else:
                data_shape = result.get("data_shape", [0, 0])
                logger.info(f"📊 數據形狀: {data_shape[0]} 行 × {data_shape[1]} 列")
                logger.info(f"📊 數值列: {result.get('numeric_columns', [])}")
                logger.info(f"📊 分類列: {result.get('categorical_columns', [])}")
        logger.info(f"📤 輸出結果前300字符: {result_str[:300]}")
        logger.info(f"✅ [get_data_info_tool] 執行完成")

        return result_str
    except Exception as e:
        logger.error(f"❌ [get_data_info_tool] 執行失敗: {e}")
        error_result = f'{{"success": false, "error": "{str(e)}"}}'
        logger.info(f"📤 錯誤輸出: {error_result}")
        return error_result


@tool
async def group_by_analysis_tool(
    file_path: str,
    group_column: str,
    value_column: str,
    operation: str = "sum",
    session_id: str = "default",
    data_source: str = "file",
) -> str:
    """
    通用分組分析工具

    Args:
        file_path: 數據文件路徑，支持特殊值 "@current" 使用當前會話的最新數據
        group_column: 分組列名
        value_column: 數值列名
        operation: 操作類型，根據分析需求選擇：
                  - "mean": 平均值（薪資分析、績效評估）
                  - "sum": 總和（銷售額、數量統計）
                  - "count": 計數（人員統計、頻次分析）
                  - "max": 最大值（最高薪資、峰值分析）
                  - "min": 最小值（最低薪資、基準分析）
        session_id: 會話ID
        data_source: 數據源類型 ("file": 從文件加載, "current": 使用當前會話數據)

    Returns:
        分組分析結果的JSON字符串
    """
    try:
        logger.info(f"🔄 group_by_analysis_tool 開始執行:")
        logger.info(f"  - 原始 file_path: {file_path}")
        logger.info(f"  - group_column: {group_column}")
        logger.info(f"  - value_column: {value_column}")
        logger.info(f"  - operation: {operation}")
        logger.info(f"  - session_id: {session_id}")
        logger.info(f"  - data_source: {data_source}")

        # 根據 data_source 參數決定數據來源
        if data_source == "current" or file_path in ["@current", "current", "latest"]:
            # 使用會話數據管理器解析路徑
            resolved_file_path = session_data_manager.resolve_file_path(
                session_id, file_path
            )
            logger.info(f"🔄 使用會話數據: {file_path} -> {resolved_file_path}")
        else:
            # 直接使用提供的文件路徑
            resolved_file_path = file_path
            logger.info(f"🔄 使用指定文件: {resolved_file_path}")

        # 檢查文件是否存在或是否為多檔案虛擬路徑
        from pathlib import Path

        if not Path(resolved_file_path).exists():
            error_msg = f"文件不存在: {resolved_file_path}"
            logger.error(f"❌ {error_msg}")
            return f'{{"success": false, "error": "{error_msg}"}}'
        else:
            # 單一檔案情況
            result = await data_analysis_tools.group_by_analysis(
                resolved_file_path, group_column, value_column, operation, session_id
            )
        logger.info(f"✅ group_by_analysis_tool 執行完成")
        import json

        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        logger.error(f"❌ 分組分析失敗: {e}")
        import traceback

        logger.error(f"❌ 詳細錯誤: {traceback.format_exc()}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def compare_datasets_tool(
    file_paths: str,
    analysis_focus: str = "general",
    session_id: str = "default"
) -> str:
    """
    比較多個資料集的工具

    Args:
        file_paths: 檔案路徑列表，用逗號分隔，例如: "path1.csv,path2.csv"
        analysis_focus: 分析重點，例如: "topic_distribution", "sentiment", "keywords", "general"
        session_id: 會話ID

    Returns:
        比較分析結果的JSON字符串
    """
    try:
        logger.info(f"🔄 compare_datasets_tool 開始執行:")
        logger.info(f"  - file_paths: {file_paths}")
        logger.info(f"  - analysis_focus: {analysis_focus}")

        # 解析檔案路徑
        paths = [path.strip() for path in file_paths.split(",")]

        if len(paths) < 2:
            return f'{{"success": false, "error": "需要至少2個檔案進行比較"}}'

        # 讀取所有檔案
        import pandas as pd
        datasets = []

        for path in paths:
            try:
                if not os.path.exists(path):
                    logger.warning(f"⚠️ 檔案不存在: {path}")
                    continue

                df = pd.read_csv(path, encoding='utf-8-sig')
                filename = os.path.basename(path)
                source = filename.split('_')[0] if '_' in filename else filename

                datasets.append({
                    "source": source,
                    "filename": filename,
                    "path": path,
                    "data": df,
                    "row_count": len(df),
                    "columns": list(df.columns)
                })

                logger.info(f"✅ 讀取檔案: {filename} ({len(df)} 行)")

            except Exception as e:
                logger.error(f"❌ 讀取檔案失敗 {path}: {e}")
                continue

        if len(datasets) < 2:
            return f'{{"success": false, "error": "成功讀取的檔案少於2個"}}'

        # 執行比較分析
        comparison_result = await _perform_dataset_comparison(datasets, analysis_focus, session_id)

        logger.info(f"✅ compare_datasets_tool 執行完成")
        return json.dumps(comparison_result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 資料集比較失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


async def _perform_dataset_comparison(datasets, analysis_focus, session_id):
    """執行資料集比較分析"""
    try:
        import pandas as pd

        # 基本統計比較
        basic_stats = {}
        common_columns = None

        for dataset in datasets:
            source = dataset["source"]
            df = dataset["data"]

            # 計算基本統計
            stats = {
                "row_count": len(df),
                "column_count": len(df.columns),
                "columns": list(df.columns)
            }

            # 找出共同欄位
            if common_columns is None:
                common_columns = set(df.columns)
            else:
                common_columns = common_columns.intersection(set(df.columns))

            basic_stats[source] = stats

        common_columns = list(common_columns)

        # 根據分析重點進行不同的比較
        detailed_analysis = {}

        if analysis_focus == "topic_distribution" or analysis_focus == "general":
            # 主題分佈比較
            detailed_analysis["topic_analysis"] = await _compare_topic_distribution(datasets, common_columns)

        if analysis_focus == "keywords" or analysis_focus == "general":
            # 關鍵字比較
            detailed_analysis["keyword_analysis"] = await _compare_keywords(datasets, common_columns)

        if analysis_focus == "general":
            # 數值欄位比較
            detailed_analysis["numeric_analysis"] = await _compare_numeric_fields(datasets, common_columns)

        return {
            "success": True,
            "session_id": session_id,
            "analysis_focus": analysis_focus,
            "datasets_compared": len(datasets),
            "common_columns": common_columns,
            "basic_statistics": basic_stats,
            "detailed_analysis": detailed_analysis,
            "summary": _generate_comparison_summary(basic_stats, detailed_analysis)
        }

    except Exception as e:
        logger.error(f"❌ 比較分析執行失敗: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def _compare_topic_distribution(datasets, common_columns):
    """比較主題分佈"""
    try:
        # 尋找可能的主題欄位
        topic_columns = []
        for col in common_columns:
            if any(keyword in col.lower() for keyword in ['topic', 'subject', 'title', 'content', '主題', '標題', '內容']):
                topic_columns.append(col)

        if not topic_columns:
            return {"message": "未找到主題相關欄位"}

        topic_analysis = {}
        for dataset in datasets:
            source = dataset["source"]
            df = dataset["data"]

            source_topics = {}
            for col in topic_columns:
                if col in df.columns:
                    # 統計該欄位的值分佈
                    value_counts = df[col].value_counts().head(10).to_dict()
                    source_topics[col] = value_counts

            topic_analysis[source] = source_topics

        return topic_analysis

    except Exception as e:
        logger.error(f"❌ 主題分佈比較失敗: {e}")
        return {"error": str(e)}


async def _compare_keywords(datasets, common_columns):
    """比較關鍵字"""
    try:
        # 尋找文本欄位
        text_columns = []
        for col in common_columns:
            if any(keyword in col.lower() for keyword in ['content', 'text', 'message', 'title', '內容', '標題', '訊息']):
                text_columns.append(col)

        if not text_columns:
            return {"message": "未找到文本欄位"}

        keyword_analysis = {}
        for dataset in datasets:
            source = dataset["source"]
            df = dataset["data"]

            # 簡單的關鍵字統計（這裡可以用更複雜的 NLP 方法）
            all_text = ""
            for col in text_columns:
                if col in df.columns:
                    all_text += " ".join(df[col].astype(str).tolist())

            # 簡單的詞頻統計
            words = all_text.split()
            word_freq = {}
            for word in words:
                if len(word) > 2:  # 過濾短詞
                    word_freq[word] = word_freq.get(word, 0) + 1

            # 取前10個高頻詞
            top_words = dict(sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10])
            keyword_analysis[source] = top_words

        return keyword_analysis

    except Exception as e:
        logger.error(f"❌ 關鍵字比較失敗: {e}")
        return {"error": str(e)}


async def _compare_numeric_fields(datasets, common_columns):
    """比較數值欄位"""
    try:
        import pandas as pd

        # 找出數值欄位
        numeric_columns = []
        for dataset in datasets:
            df = dataset["data"]
            for col in common_columns:
                if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                    if col not in numeric_columns:
                        numeric_columns.append(col)

        if not numeric_columns:
            return {"message": "未找到共同的數值欄位"}

        numeric_analysis = {}
        for dataset in datasets:
            source = dataset["source"]
            df = dataset["data"]

            source_stats = {}
            for col in numeric_columns:
                if col in df.columns:
                    stats = {
                        "mean": float(df[col].mean()),
                        "median": float(df[col].median()),
                        "std": float(df[col].std()),
                        "min": float(df[col].min()),
                        "max": float(df[col].max())
                    }
                    source_stats[col] = stats

            numeric_analysis[source] = source_stats

        return numeric_analysis

    except Exception as e:
        logger.error(f"❌ 數值欄位比較失敗: {e}")
        return {"error": str(e)}


def _generate_comparison_summary(basic_stats, detailed_analysis):
    """生成比較摘要"""
    try:
        summary = []

        # 基本統計摘要
        sources = list(basic_stats.keys())
        summary.append(f"比較了 {len(sources)} 個資料集: {', '.join(sources)}")

        for source, stats in basic_stats.items():
            summary.append(f"{source}: {stats['row_count']} 行資料，{stats['column_count']} 個欄位")

        # 詳細分析摘要
        if "topic_analysis" in detailed_analysis:
            summary.append("已進行主題分佈比較")

        if "keyword_analysis" in detailed_analysis:
            summary.append("已進行關鍵字比較")

        if "numeric_analysis" in detailed_analysis:
            summary.append("已進行數值欄位比較")

        return summary

    except Exception as e:
        logger.error(f"❌ 生成摘要失敗: {e}")
        return ["摘要生成失敗"]


@tool
async def threshold_analysis_tool(
    file_path: str,
    value_column: str,
    threshold: float,
    comparison: str = "greater",
    session_id: str = "default",
) -> str:
    """
    通用閾值分析工具

    Args:
        file_path: 數據文件路徑，支持特殊值 "@current" 使用當前會話的最新數據
        value_column: 數值列名
        threshold: 閾值
        comparison: 比較方式 (greater, less, equal)
        session_id: 會話ID

    Returns:
        閾值分析結果的JSON字符串
    """
    try:
        # 解析文件路徑
        resolved_file_path = session_data_manager.resolve_file_path(
            session_id, file_path
        )
        logger.info(f"🔄 threshold_analysis_tool: {file_path} -> {resolved_file_path}")

        result = await data_analysis_tools.threshold_analysis(
            resolved_file_path, value_column, threshold, comparison, session_id
        )
        import json

        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        logger.error(f"❌ 閾值分析失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def read_data_file_tool(file_path: str, session_id: str = "default") -> str:
    """
    讀取數據文件

    Args:
        file_path: 數據文件路徑
        session_id: 會話ID

    Returns:
        數據內容的JSON字符串
    """
    try:
        result = await data_file_tools.read_data_file(file_path, session_id=session_id)
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        logger.error(f"❌ 讀取數據文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def filter_data_tool(
    file_path: str,
    filter_conditions: str,
    session_id: str = "default",
    save_filtered_data: bool = False,
    selected_columns: str = None,
) -> str:
    """
    根據條件過濾數據文件，支持列選擇

    Args:
        file_path: 數據文件路徑
        filter_conditions: 過濾條件的JSON字符串，例如: {"column": "age", "operator": ">", "value": 25}
        session_id: 會話ID
        save_filtered_data: 是否將過濾後的數據保存為臨時文件，供其他工具使用
        selected_columns: 要保留的列名JSON數組，例如: ["姓名", "部門", "基本薪資"]，如果為None則保留所有列

    Returns:
        過濾後的數據JSON字符串，如果save_filtered_data=True，還會包含臨時文件路徑
    """
    try:
        import json
        import pandas as pd
        import os

        # 解析過濾條件
        conditions = json.loads(filter_conditions)

        # 讀取數據文件
        if not os.path.exists(file_path):
            return f'{{"success": false, "error": "文件不存在: {file_path}"}}'

        # 根據文件類型讀取
        file_ext = os.path.splitext(file_path)[1].lower()

        if file_ext == ".csv":
            df = pd.read_csv(file_path)
        elif file_ext == ".json":
            df = pd.read_json(file_path)
        elif file_ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
        else:
            return f'{{"success": false, "error": "不支持的文件格式: {file_ext}"}}'

        # 應用過濾條件
        if isinstance(conditions, dict):
            conditions = [conditions]  # 轉換為列表

        filtered_df = df.copy()

        for condition in conditions:
            column = condition.get("column")
            operator = condition.get("operator")
            value = condition.get("value")

            if column not in filtered_df.columns:
                continue

            if operator == ">":
                filtered_df = filtered_df[filtered_df[column] > value]
            elif operator == "<":
                filtered_df = filtered_df[filtered_df[column] < value]
            elif operator == ">=":
                filtered_df = filtered_df[filtered_df[column] >= value]
            elif operator == "<=":
                filtered_df = filtered_df[filtered_df[column] <= value]
            elif operator == "==":
                filtered_df = filtered_df[filtered_df[column] == value]
            elif operator == "!=":
                filtered_df = filtered_df[filtered_df[column] != value]
            elif operator == "contains":
                filtered_df = filtered_df[
                    filtered_df[column].str.contains(str(value), na=False)
                ]
            elif operator == "in":
                filtered_df = filtered_df[filtered_df[column].isin(value)]

        # 處理列選擇
        if selected_columns:
            try:
                columns_list = (
                    json.loads(selected_columns)
                    if isinstance(selected_columns, str)
                    else selected_columns
                )
                if isinstance(columns_list, list):
                    # 檢查列是否存在
                    available_columns = [
                        col for col in columns_list if col in filtered_df.columns
                    ]
                    missing_columns = [
                        col for col in columns_list if col not in filtered_df.columns
                    ]

                    if missing_columns:
                        logger.warning(f"⚠️ 以下列不存在: {missing_columns}")

                    if available_columns:
                        filtered_df = filtered_df[available_columns]
                        logger.info(f"✅ 已選擇列: {available_columns}")
                    else:
                        logger.warning(f"⚠️ 沒有有效的列可選擇，保留所有列")
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"⚠️ 列選擇參數格式錯誤: {e}，保留所有列")

        # 準備基本結果
        result = {
            "success": True,
            "original_rows": len(df),
            "filtered_rows": len(filtered_df),
            "columns": list(filtered_df.columns),
            "filter_conditions": conditions,
        }

        # 如果需要保存臨時文件
        if save_filtered_data and len(filtered_df) > 0:
            import tempfile
            import os
            from pathlib import Path

            # 創建會話級臨時目錄
            temp_dir = Path(tempfile.gettempdir()) / "agent_sessions" / session_id
            temp_dir.mkdir(parents=True, exist_ok=True)

            # 生成臨時文件名
            original_name = Path(file_path).stem
            timestamp = __import__("datetime").datetime.now().strftime("%Y%m%d_%H%M%S")
            temp_filename = f"{original_name}_filtered_{timestamp}.json"
            temp_file_path = temp_dir / temp_filename

            # 保存過濾後的數據為JSON格式，確保中文字符正確顯示
            filtered_df.to_json(temp_file_path, orient='records', indent=2, force_ascii=False)

            # 更新會話數據狀態
            session_data_manager.update_data_state(
                session_id=session_id,
                original_file=file_path,
                current_file=str(temp_file_path),
                operation="filter",
                metadata={
                    "original_rows": len(df),
                    "filtered_rows": len(filtered_df),
                    "filter_conditions": conditions,
                },
                description=f"過濾條件: {conditions}",
            )

            result.update(
                {
                    "temp_file_path": str(temp_file_path),
                    "temp_file_created": True,
                    "current_data_updated": True,
                    "message": f"過濾後的數據已保存到臨時文件並設為當前數據源: {temp_file_path}",
                }
            )

            # 只返回前10行數據預覽，避免響應過大
            result["data_preview"] = filtered_df.head(10).to_dict("records")
            logger.info(f"✅ 過濾後數據已保存到臨時文件: {temp_file_path}")
        else:
            # 不保存文件時，返回完整數據（但限制在100行以內）
            max_rows = 100
            if len(filtered_df) > max_rows:
                result["data"] = filtered_df.head(max_rows).to_dict("records")
                result["data_truncated"] = True
                result["message"] = (
                    f"數據已截斷，只顯示前{max_rows}行。如需完整數據，請設置save_filtered_data=True"
                )
            else:
                result["data"] = filtered_df.to_dict("records")

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 數據過濾失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def cleanup_temp_files_tool(session_id: str = "default") -> str:
    """
    清理會話的臨時文件

    Args:
        session_id: 會話ID

    Returns:
        清理結果的JSON字符串
    """
    try:
        import tempfile
        import shutil
        from pathlib import Path

        temp_dir = Path(tempfile.gettempdir()) / "agent_sessions" / session_id

        if temp_dir.exists():
            # 計算文件數量和大小
            files = list(temp_dir.glob("*"))
            file_count = len(files)
            total_size = sum(f.stat().st_size for f in files if f.is_file())

            # 刪除整個會話目錄
            shutil.rmtree(temp_dir)

            result = {
                "success": True,
                "cleaned_files": file_count,
                "freed_space_bytes": total_size,
                "message": f"已清理 {file_count} 個臨時文件，釋放 {total_size} 字節空間",
            }
        else:
            result = {
                "success": True,
                "cleaned_files": 0,
                "message": "沒有找到需要清理的臨時文件",
            }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 清理臨時文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def get_session_data_status_tool(session_id: str = "default") -> str:
    """
    獲取會話的數據狀態信息

    Args:
        session_id: 會話ID

    Returns:
        會話數據狀態的JSON字符串
    """
    try:
        summary = session_data_manager.get_session_summary(session_id)
        history = session_data_manager.get_data_history(session_id)

        result = {
            "success": True,
            "session_summary": summary,
            "data_history": history,
            "message": f"會話 {session_id} 數據狀態信息",
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 獲取會話數據狀態失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def clear_session_data_tool(session_id: str = "default") -> str:
    """
    清理會話的數據狀態（不刪除實際文件）

    Args:
        session_id: 會話ID

    Returns:
        清理結果的JSON字符串
    """
    try:
        import json
        result = session_data_manager.clear_session_data(session_id)
        result["success"] = True

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 清理會話數據狀態失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def suggest_analysis_operation_tool(analysis_purpose: str) -> str:
    """
    根據分析目的建議合適的操作類型

    Args:
        analysis_purpose: 分析目的描述，例如 "計算部門平均薪資"、"統計各部門人數"

    Returns:
        建議的操作類型和說明
    """
    try:
        import json
        purpose_lower = analysis_purpose.lower()

        suggestions = {
            "mean": {
                "keywords": [
                    "平均",
                    "均值",
                    "average",
                    "mean",
                    "薪資分析",
                    "績效",
                    "評分",
                ],
                "description": "計算平均值，適用於薪資分析、績效評估、評分統計等",
            },
            "sum": {
                "keywords": [
                    "總和",
                    "總計",
                    "合計",
                    "sum",
                    "total",
                    "銷售額",
                    "營收",
                    "數量",
                ],
                "description": "計算總和，適用於銷售額統計、數量合計、營收分析等",
            },
            "count": {
                "keywords": ["數量", "人數", "個數", "count", "統計", "頻次", "次數"],
                "description": "計算數量，適用於人員統計、頻次分析、計數統計等",
            },
            "max": {
                "keywords": ["最大", "最高", "max", "maximum", "峰值", "頂點"],
                "description": "找出最大值，適用於最高薪資、峰值分析、極值統計等",
            },
            "min": {
                "keywords": ["最小", "最低", "min", "minimum", "基準", "底線"],
                "description": "找出最小值，適用於最低薪資、基準分析、極值統計等",
            },
        }

        # 根據關鍵詞匹配建議操作
        best_match = "sum"  # 默認
        best_score = 0

        for operation, info in suggestions.items():
            score = sum(1 for keyword in info["keywords"] if keyword in purpose_lower)
            if score > best_score:
                best_score = score
                best_match = operation

        result = {
            "success": True,
            "analysis_purpose": analysis_purpose,
            "suggested_operation": best_match,
            "description": suggestions[best_match]["description"],
            "all_options": {
                op: info["description"] for op, info in suggestions.items()
            },
            "usage_example": f'group_by_analysis_tool("@current", "group_column", "value_column", "{best_match}", session_id)',
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 建議分析操作失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def filter_and_analyze_tool(
    file_path: str,
    filter_conditions: str,
    group_column: str,
    value_column: str,
    operation: str = "mean",
    selected_columns: str = None,
    session_id: str = "default",
) -> str:
    """
    一步完成過濾和分組分析的組合工具

    Args:
        file_path: 數據文件路徑
        filter_conditions: 過濾條件的JSON字符串
        group_column: 分組列名
        value_column: 數值列名
        operation: 操作類型 (mean, sum, count, max, min)
        selected_columns: 要保留的列名JSON數組，例如: ["姓名", "部門", "基本薪資"]
        session_id: 會話ID

    Returns:
        分析結果的JSON字符串
    """
    try:
        import json

        logger.info(f"🔄 filter_and_analyze_tool 開始執行:")
        logger.info(f"  - file_path: {file_path}")
        logger.info(f"  - filter_conditions: {filter_conditions}")
        logger.info(f"  - group_column: {group_column}")
        logger.info(f"  - value_column: {value_column}")
        logger.info(f"  - operation: {operation}")
        logger.info(f"  - selected_columns: {selected_columns}")

        # 步驟1: 過濾數據並選擇列
        filter_result = await filter_data_tool.ainvoke(
            {
                "file_path": file_path,
                "filter_conditions": filter_conditions,
                "session_id": session_id,
                "save_filtered_data": True,
                "selected_columns": selected_columns,
            }
        )

        filter_data = json.loads(filter_result)
        if not filter_data.get("success", False):
            return filter_result  # 返回過濾錯誤

        logger.info(f"✅ 過濾完成: {filter_data.get('filtered_rows', 0)} 行")

        # 步驟2: 對過濾後的數據進行分組分析
        analysis_result = await group_by_analysis_tool.ainvoke(
            {
                "file_path": "@current",  # 使用過濾後的數據
                "group_column": group_column,
                "value_column": value_column,
                "operation": operation,
                "session_id": session_id,
                "data_source": "current",
            }
        )

        analysis_data = json.loads(analysis_result)
        if not analysis_data.get("success", False):
            return analysis_result  # 返回分析錯誤

        # 步驟3: 組合結果
        combined_result = {
            "success": True,
            "tool_type": "filter_and_analyze",
            "filter_info": {
                "original_rows": filter_data.get("original_rows", 0),
                "filtered_rows": filter_data.get("filtered_rows", 0),
                "selected_columns": (
                    json.loads(selected_columns) if selected_columns else "all"
                ),
                "filter_conditions": json.loads(filter_conditions),
            },
            "analysis_info": {
                "group_column": group_column,
                "value_column": value_column,
                "operation": operation,
            },
            "results": analysis_data.get("results", {}),
            "summary": analysis_data.get("summary", {}),
            "temp_file_path": filter_data.get("temp_file_path"),
            "message": f"成功過濾 {filter_data.get('filtered_rows', 0)} 行數據並完成 {operation} 分析",
        }

        logger.info(f"✅ filter_and_analyze_tool 執行完成")
        return json.dumps(combined_result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 過濾分析組合工具失敗: {e}")
        import traceback

        logger.error(f"❌ 詳細錯誤: {traceback.format_exc()}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def create_data_file_tool(
    file_path: str, data: str, file_type: str = "csv", session_id: str = "default"
) -> str:
    """
    創建新的數據文件

    Args:
        file_path: 文件路徑
        data: 數據內容的JSON字符串
        file_type: 文件類型 (csv, json, xlsx)
        session_id: 會話ID

    Returns:
        創建結果的JSON字符串
    """
    try:
        import json
        import pandas as pd
        import os

        # 解析數據
        data_dict = json.loads(data)

        # 確保目錄存在
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # 創建DataFrame
        if isinstance(data_dict, list):
            df = pd.DataFrame(data_dict)
        elif isinstance(data_dict, dict):
            df = pd.DataFrame([data_dict])
        else:
            return f'{{"success": false, "error": "數據格式不正確"}}'

        # 根據文件類型保存
        if file_type.lower() == 'csv':
            df.to_csv(file_path, index=False, encoding='utf-8')
        elif file_type.lower() == 'json':
            df.to_json(file_path, orient='records', indent=2, force_ascii=False)
        elif file_type.lower() == 'xlsx':
            df.to_excel(file_path, index=False)
        else:
            return f'{{"success": false, "error": "不支持的文件類型: {file_type}"}}'

        result = {
            "success": True,
            "file_path": file_path,
            "file_type": file_type,
            "rows_created": len(df),
            "columns": list(df.columns),
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 創建數據文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def update_data_rows_tool(
    file_path: str, update_conditions: str, new_values: str, session_id: str = "default"
) -> str:
    """
    更新數據文件中的行

    Args:
        file_path: 數據文件路徑
        update_conditions: 更新條件的JSON字符串
        new_values: 新值的JSON字符串
        session_id: 會話ID

    Returns:
        更新結果的JSON字符串
    """
    try:
        import json
        import pandas as pd
        import os

        if not os.path.exists(file_path):
            return f'{{"success": false, "error": "文件不存在: {file_path}"}}'

        # 解析條件和新值
        conditions = json.loads(update_conditions)
        values = json.loads(new_values)

        # 讀取數據
        file_ext = os.path.splitext(file_path)[1].lower()

        if file_ext == ".csv":
            df = pd.read_csv(file_path)
        elif file_ext == ".json":
            df = pd.read_json(file_path)
        elif file_ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
        else:
            return f'{{"success": false, "error": "不支持的文件格式: {file_ext}"}}'

        # 應用更新條件
        mask = pd.Series([True] * len(df))

        for condition in conditions:
            column = condition.get("column")
            operator = condition.get("operator")
            value = condition.get("value")

            if column not in df.columns:
                continue

            if operator == "==":
                mask &= df[column] == value
            elif operator == "!=":
                mask &= df[column] != value
            elif operator == ">":
                mask &= df[column] > value
            elif operator == "<":
                mask &= df[column] < value
            elif operator == "contains":
                mask &= df[column].str.contains(str(value), na=False)

        # 更新數據
        updated_rows = mask.sum()

        for column, new_value in values.items():
            if column in df.columns:
                df.loc[mask, column] = new_value

        # 保存文件
        if file_ext == ".csv":
            df.to_csv(file_path, index=False, encoding="utf-8")
        elif file_ext == ".json":
            df.to_json(file_path, orient="records", ensure_ascii=False, indent=2)
        elif file_ext == ".xlsx":
            df.to_excel(file_path, index=False)

        result = {
            "success": True,
            "file_path": file_path,
            "updated_rows": int(updated_rows),
            "total_rows": len(df),
            "update_conditions": conditions,
            "new_values": values,
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 更新數據失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def delete_data_rows_tool(
    file_path: str, delete_conditions: str, session_id: str = "default"
) -> str:
    """
    刪除數據文件中的行

    Args:
        file_path: 數據文件路徑
        delete_conditions: 刪除條件的JSON字符串
        session_id: 會話ID

    Returns:
        刪除結果的JSON字符串
    """
    try:
        import json
        import pandas as pd
        import os

        if not os.path.exists(file_path):
            return f'{{"success": false, "error": "文件不存在: {file_path}"}}'

        # 解析刪除條件
        conditions = json.loads(delete_conditions)

        # 讀取數據
        file_ext = os.path.splitext(file_path)[1].lower()

        if file_ext == ".csv":
            df = pd.read_csv(file_path)
        elif file_ext == ".json":
            df = pd.read_json(file_path)
        elif file_ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
        else:
            return f'{{"success": false, "error": "不支持的文件格式: {file_ext}"}}'

        original_rows = len(df)

        # 應用刪除條件
        mask = pd.Series([False] * len(df))

        for condition in conditions:
            column = condition.get("column")
            operator = condition.get("operator")
            value = condition.get("value")

            if column not in df.columns:
                continue

            if operator == "==":
                mask |= df[column] == value
            elif operator == "!=":
                mask |= df[column] != value
            elif operator == ">":
                mask |= df[column] > value
            elif operator == "<":
                mask |= df[column] < value
            elif operator == "contains":
                mask |= df[column].str.contains(str(value), na=False)

        # 刪除數據
        df_filtered = df[~mask]
        deleted_rows = original_rows - len(df_filtered)

        # 保存文件
        if file_ext == '.csv':
            df_filtered.to_csv(file_path, index=False, encoding='utf-8')
        elif file_ext == '.json':
            df_filtered.to_json(file_path, orient='records', indent=2, force_ascii=False)
        elif file_ext == '.xlsx':
            df_filtered.to_excel(file_path, index=False)

        result = {
            "success": True,
            "file_path": file_path,
            "deleted_rows": int(deleted_rows),
            "remaining_rows": len(df_filtered),
            "original_rows": original_rows,
            "delete_conditions": conditions,
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 刪除數據失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


# 添加更多工具
@tool
async def highlight_file_sections_tool(
    file_path: str, ranges: str, session_id: str = "default"
) -> str:
    """
    高亮文件區域

    Args:
        file_path: 文件路徑
        ranges: 範圍列表的JSON字符串
        session_id: 會話ID

    Returns:
        高亮結果的JSON字符串
    """
    try:
        import json

        ranges_list = json.loads(ranges)
        result = await local_file_tools.highlight_file_sections(
            file_path, ranges_list, session_id
        )
        return str(result)
    except Exception as e:
        logger.error(f"❌ 高亮文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def save_file_tool(
    file_path: str, content: str, encoding: str = "utf-8", session_id: str = "default"
) -> str:
    """
    保存文件

    Args:
        file_path: 文件路徑
        content: 文件內容
        encoding: 編碼格式
        session_id: 會話ID

    Returns:
        保存結果的JSON字符串
    """
    try:
        result = await local_file_tools.save_file(
            file_path, content, encoding, session_id
        )
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        logger.error(f"❌ 保存文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def create_file_tool(
    file_path: str,
    content: str = "",
    encoding: str = "utf-8",
    session_id: str = "default",
) -> str:
    """
    創建文件

    Args:
        file_path: 文件路徑
        content: 文件內容
        encoding: 編碼格式
        session_id: 會話ID

    Returns:
        創建結果的JSON字符串
    """
    try:
        result = await local_file_tools.create_file(
            file_path, content, encoding, session_id
        )
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        logger.error(f"❌ 創建文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def correlation_analysis_tool(
    file_path: str, x_column: str, y_column: str, session_id: str = "default"
) -> str:
    """
    相關性分析

    Args:
        file_path: 數據文件路徑
        x_column: X軸變量列名
        y_column: Y軸變量列名
        session_id: 會話ID

    Returns:
        相關性分析結果的JSON字符串
    """
    try:
        result = await data_analysis_tools.correlation_analysis(
            file_path, x_column, y_column, session_id
        )
        return str(result)
    except Exception as e:
        logger.error(f"❌ 相關性分析失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def linear_prediction_tool(
    file_path: str,
    x_column: str,
    y_column: str,
    target_x_value: float,
    session_id: str = "default",
) -> str:
    """
    線性預測

    Args:
        file_path: 數據文件路徑
        x_column: X軸變量列名
        y_column: Y軸變量列名
        target_x_value: 目標X值
        session_id: 會話ID

    Returns:
        預測結果的JSON字符串
    """
    try:
        result = await data_analysis_tools.linear_prediction(
            file_path, x_column, y_column, target_x_value, session_id
        )
        return str(result)
    except Exception as e:
        logger.error(f"❌ 線性預測失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def edit_data_file_tool(
    file_path: str, operation: str, data: str, session_id: str = "default"
) -> str:
    """
    編輯數據文件

    Args:
        file_path: 數據文件路徑
        operation: 操作類型 (add_row, delete_row, update_cell, update_row)
        data: 操作數據的JSON字符串
        session_id: 會話ID

    Returns:
        編輯結果的JSON字符串
    """
    # 記錄輸入
    logger.info(f"🔧 [edit_data_file_tool] 開始執行")
    logger.info(f"📥 輸入參數:")
    logger.info(f"   - file_path: '{file_path}'")
    logger.info(f"   - operation: '{operation}'")
    logger.info(f"   - data: '{data}'")
    logger.info(f"   - session_id: '{session_id}'")

    try:
        # 步驟1: 驗證操作類型
        logger.info(f"📋 步驟1: 驗證操作類型")
        valid_operations = ["add_row", "delete_row", "update_cell", "update_row"]
        if operation not in valid_operations:
            raise ValueError(
                f"不支持的操作類型: {operation}，支持的操作: {valid_operations}"
            )
        logger.info(f"✓ 操作類型有效: {operation}")

        # 步驟2: 解析數據
        logger.info(f"📋 步驟2: 解析操作數據")
        import json

        try:
            parsed_data = json.loads(data)
            logger.info(f"✓ 數據解析成功: {type(parsed_data)}")
        except json.JSONDecodeError as e:
            raise ValueError(f"數據格式錯誤: {e}")

        # 步驟3: 調用編輯工具
        logger.info(f"📋 步驟3: 調用 data_file_tools.edit_data_file")
        result = await data_file_tools.edit_data_file(
            file_path, operation, data, session_id
        )

        # 步驟4: 處理結果
        logger.info(f"📋 步驟4: 處理編輯結果")
        result_str = json.dumps(result, ensure_ascii=False)

        # 記錄輸出
        logger.info(f"📤 輸出結果長度: {len(result_str)} 字符")
        if isinstance(result, dict) and result.get("success"):
            logger.info(f"✅ 編輯操作成功完成")
            if "affected_rows" in result:
                logger.info(f"📊 影響行數: {result['affected_rows']}")
        logger.info(f"📤 輸出結果前300字符: {result_str[:300]}")
        logger.info(f"✅ [edit_data_file_tool] 執行完成")

        return result_str
    except Exception as e:
        logger.error(f"❌ [edit_data_file_tool] 執行失敗: {e}")
        error_result = f'{{"success": false, "error": "{str(e)}"}}'
        logger.info(f"📤 錯誤輸出: {error_result}")
        return error_result


@tool
async def delete_file_tool(file_path: str, session_id: str = "default") -> str:
    """
    刪除文件

    Args:
        file_path: 文件路徑
        session_id: 會話ID

    Returns:
        刪除結果的JSON字符串
    """
    try:
        result = await local_file_tools.delete_file(file_path, session_id)
        return str(result)
    except Exception as e:
        logger.error(f"❌ 刪除文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'


@tool
async def gmail_fingerprint_search_tool(
    file_path: str,
    search_query: str,
    session_id: str = "default",
    similarity_threshold: float = 0.7,
    max_results: int = None,
    save_results: bool = True
) -> str:
    """
    使用指紋搜尋技術在 Gmail CSV 文件中進行智能文字搜尋

    基於 Google 指紋搜尋概念，結合語義搜尋和關鍵字匹配，
    能夠找到與查詢語義相關的內容，而不僅僅是精確匹配。

    專門針對 Gmail CSV 格式優化，搜尋 'subject' 和 'content' 欄位。

    Args:
        file_path: CSV 檔案路徑
        search_query: 搜尋查詢詞（支援自然語言描述）
        session_id: 會話ID
        similarity_threshold: 相似度閾值 (0.0-6.2)，越高越嚴格，預設 0.7
        max_results: 最大返回結果數 (None 表示不限制，根據閾值自然過濾)
        save_results: 是否將結果保存為新的 CSV 檔案

    Returns:
        搜尋結果的JSON字符串，包含匹配數量、結果檔案路徑和樣本數據

    Examples:
        - search_query: "財務相關的郵件" - 會找到包含金額、發票、付款等內容
        - search_query: "客戶投訴" - 會找到包含問題、抱怨、退貨等內容
        - search_query: "產品詢問" - 會找到包含產品名稱、規格、價格等內容
    """
    try:
        if not FINGERPRINT_SEARCH_AVAILABLE:
            return json.dumps({
                "success": False,
                "error": "指紋搜尋功能不可用，請檢查相關依賴"
            }, ensure_ascii=False)

        logger.info(f"🔍 執行指紋搜尋: '{search_query}' in {file_path}")

        result = await fingerprint_search_csv(
            file_path=file_path,
            search_query=search_query,
            session_id=session_id,
            similarity_threshold=similarity_threshold,
            max_results=max_results,
            save_results=save_results
        )

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 指紋搜尋失敗: {e}")
        return json.dumps({
            "success": False,
            "error": f"指紋搜尋失敗: {str(e)}"
        }, ensure_ascii=False)


@tool
async def fingerprint_search_tool(
    file_path: str,
    search_query: str,
    search_columns: str,
    session_id: str = "default",
    similarity_threshold: float = 0.7,
    max_results: int = None,
    save_results: bool = True
) -> str:
    """
    使用指紋搜尋技術在 CSV 文件中進行智能文字搜尋（可指定搜尋欄位）

    通用版本的指紋搜尋工具，允許用戶指定要搜尋的欄位名稱，
    適用於各種 CSV 格式，不限於 Gmail 數據。

    基於 Google 指紋搜尋概念，結合語義搜尋和關鍵字匹配，
    能夠找到與查詢語義相關的內容，而不僅僅是精確匹配。

    Args:
        file_path: CSV 檔案路徑
        search_query: 搜尋查詢詞（支援自然語言描述）
        search_columns: 要搜尋的欄位名稱，用逗號分隔（例如："title,description" 或 "content,body,summary"）
        session_id: 會話ID
        similarity_threshold: 相似度閾值 (0.0-6.2)，越高越嚴格，預設 0.7
        max_results: 最大返回結果數 (None 表示不限制，根據閾值自然過濾)
        save_results: 是否將結果保存為新的 CSV 檔案

    Returns:
        搜尋結果的JSON字符串，包含匹配數量、結果檔案路徑和樣本數據

    Examples:
        - search_columns: "subject,content" - 搜尋主題和內容欄位
        - search_columns: "title,description,body" - 搜尋標題、描述和正文欄位
        - search_columns: "name,address,phone" - 搜尋姓名、地址和電話欄位
        - search_query: "財務相關的郵件" - 會找到包含金額、發票、付款等內容
        - search_query: "客戶投訴" - 會找到包含問題、抱怨、退貨等內容
    """
    try:
        if not FLEXIBLE_FINGERPRINT_SEARCH_AVAILABLE:
            return json.dumps({
                "success": False,
                "error": "靈活指紋搜尋功能不可用，請檢查相關依賴"
            }, ensure_ascii=False)

        # 解析搜尋欄位
        search_columns_list = [col.strip() for col in search_columns.split(',') if col.strip()]

        if not search_columns_list:
            return json.dumps({
                "success": False,
                "error": "請提供有效的搜尋欄位名稱"
            }, ensure_ascii=False)

        logger.info(f"🔍 執行靈活指紋搜尋: '{search_query}' in columns {search_columns_list} from {file_path}")

        # 檢查是否為合併資料集
        if file_path.endswith('combined_datasets'):
            logger.info(f"🔄 處理合併資料集搜尋: {file_path}")
            result = await _handle_combined_dataset_search(
                file_path=file_path,
                search_query=search_query,
                search_columns=search_columns_list,
                session_id=session_id,
                similarity_threshold=similarity_threshold,
                max_results=max_results,
                save_results=save_results
            )
        else:
            result = await flexible_fingerprint_search_csv(
                file_path=file_path,
                search_query=search_query,
                search_columns=search_columns_list,
                session_id=session_id,
                similarity_threshold=similarity_threshold,
                max_results=max_results,
                save_results=save_results
            )

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 靈活指紋搜尋失敗: {e}")
        return json.dumps({
            "success": False,
            "error": f"靈活指紋搜尋失敗: {str(e)}"
        }, ensure_ascii=False)


async def _handle_combined_dataset_search(
    file_path: str,
    search_query: str,
    search_columns: List[str],
    session_id: str = "default",
    similarity_threshold: float = 0.7,
    max_results: int = None,
    save_results: bool = True
) -> Dict[str, Any]:
    """
    處理合併資料集的搜尋

    Args:
        file_path: 合併資料集的虛擬路徑
        search_query: 搜尋查詢詞
        search_columns: 要搜尋的欄位名稱列表
        session_id: 會話ID
        similarity_threshold: 相似度閾值
        max_results: 最大返回結果數
        save_results: 是否保存結果

    Returns:
        搜尋結果的字典
    """
    try:
        logger.info(f"🔄 開始處理合併資料集搜尋: {file_path}")

        # 從Agent的上下文獲取合併資料集的內容
        # 這需要通過Agent的context參數傳遞
        from backend.api.routers.agent import get_agent
        agent = get_agent(session_id)

        # 嘗試從Agent的上下文中獲取合併資料集
        combined_data = None
        if hasattr(agent, 'current_context') and agent.current_context:
            context_data = agent.current_context.get('context_data', {})
            if 'file_summary' in context_data:
                file_summary = context_data['file_summary']
                # 檢查是否為合併資料集格式
                if isinstance(file_summary, dict) and 'segments' in file_summary:
                    segments = file_summary['segments']
                    # 重構合併資料集格式
                    combined_data = []
                    for segment in segments:
                        if 'content_type' in segment:
                            combined_data.append({
                                'source': segment.get('content_type', 'unknown'),
                                'date': '2025-01-26',  # 從segment summary中提取
                                'time': '12:00:00',
                                'data': []  # 實際資料需要從其他地方獲取
                            })

        if not combined_data:
            return {
                "success": False,
                "error": "無法獲取合併資料集的上下文資料，請確保資料集已正確載入"
            }
        if not combined_data:
            return {
                "success": False,
                "error": "合併資料集為空"
            }

        logger.info(f"📊 合併資料集包含 {len(combined_data)} 個資料源")

        # 對每個資料源進行搜尋
        all_results = []
        total_matches = 0
        total_processed = 0

        for dataset in combined_data:
            source = dataset.get('source', 'unknown')
            data = dataset.get('data', [])

            if not data:
                continue

            logger.info(f"🔍 搜尋 {source} 資料源 ({len(data)} 筆資料)")

            # 將資料轉換為DataFrame進行搜尋
            import pandas as pd
            df = pd.DataFrame(data)

            # 檢查搜尋欄位是否存在
            available_columns = df.columns.tolist()
            valid_columns = [col for col in search_columns if col in available_columns]
            invalid_columns = [col for col in search_columns if col not in available_columns]

            if invalid_columns:
                logger.warning(f"⚠️ {source} 資料源中以下欄位不存在: {invalid_columns}")

            if not valid_columns:
                logger.warning(f"⚠️ {source} 資料源中沒有有效的搜尋欄位")
                continue

            # 使用靈活指紋搜尋引擎進行搜尋
            from .flexible_fingerprint_search_tool import flexible_search_engine

            # 創建臨時CSV檔案進行搜尋
            import tempfile
            import os

            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8-sig') as temp_file:
                df.to_csv(temp_file.name, index=False)
                temp_path = temp_file.name

            try:
                # 執行搜尋
                result_df, search_info = await flexible_search_engine.search_csv_flexible(
                    temp_path, search_query, valid_columns, similarity_threshold, max_results
                )

                # 為結果添加資料源標識
                if not result_df.empty:
                    result_df['_data_source'] = source
                    result_df['_dataset_date'] = dataset.get('date', '')
                    result_df['_dataset_time'] = dataset.get('time', '')

                    # 添加到總結果中
                    for _, row in result_df.iterrows():
                        all_results.append({
                            "data_source": source,
                            "dataset_date": dataset.get('date', ''),
                            "dataset_time": dataset.get('time', ''),
                            "similarity_score": row.get('_similarity_score', 0),
                            "data": {k: v for k, v in row.items() if not k.startswith('_')}
                        })

                total_matches += search_info.get('matches_found', 0)
                total_processed += search_info.get('total_processed', 0)

                logger.info(f"✅ {source} 搜尋完成: {search_info.get('matches_found', 0)} 筆匹配")

            finally:
                # 清理臨時檔案
                if os.path.exists(temp_path):
                    os.unlink(temp_path)

        # 按相似度排序所有結果
        all_results.sort(key=lambda x: x['similarity_score'], reverse=True)

        # 限制結果數量
        if max_results and len(all_results) > max_results:
            all_results = all_results[:max_results]

        # 保存結果（如果需要）
        results_file = None
        if save_results and all_results:
            from src.tools.session_data_manager import session_data_manager
            from datetime import datetime

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"combined_search_results_{timestamp}.json"
            results_file = session_data_manager.get_temp_file_path(session_id, filename)

            import json
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump(all_results, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ 合併搜尋結果已保存到: {results_file}")

        return {
            "success": True,
            "total_matches": total_matches,
            "total_processed": total_processed,
            "search_columns": search_columns,
            "results_file": results_file,
            "sample_results": all_results[:5],  # 返回前5個結果作為樣本
            "search_info": {
                "matches_found": total_matches,
                "total_processed": total_processed,
                "datasets_searched": len(combined_data),
                "query": search_query,
                "threshold": similarity_threshold
            },
            "message": f"在 {len(combined_data)} 個資料源的欄位 {search_columns} 中找到 {total_matches} 筆匹配結果"
        }

    except Exception as e:
        logger.error(f"❌ 合併資料集搜尋失敗: {e}")
        import traceback
        logger.error(f"❌ 詳細錯誤: {traceback.format_exc()}")
        return {
            "success": False,
            "error": f"合併資料集搜尋失敗: {str(e)}"
        }


@tool
async def convert_gmail_csv_format_tool(
    input_file: str,
    output_file: str = None,
    preview_only: bool = False,
    session_id: str = "default"
) -> str:
    """
    轉換 Gmail CSV 格式為標準化格式

    修改內容：
    1. 移除 id 欄位
    2. 簡化 sender 格式（只保留名稱和郵箱，移除多餘引號）
    3. 標準化日期格式為數字顯示（YYYY-MM-DD HH:MM:SS）

    Args:
        input_file: 輸入 CSV 文件路徑
        output_file: 輸出 CSV 文件路徑（可選，預設為原文件名_formatted.csv）
        preview_only: 是否只預覽轉換結果而不實際轉換
        session_id: 會話ID

    Returns:
        轉換結果的JSON字符串

    Examples:
        原始格式: "舒培培" <peipeishu93@gmail.com>, Wed, 20 Aug 2025 15:12:34 +0800
        轉換後: 舒培培 <peipeishu93@gmail.com>, 2025-08-20 15:12:34
    """
    try:
        if not CSV_CONVERTER_AVAILABLE:
            return json.dumps({
                "success": False,
                "error": "CSV 格式轉換功能不可用，請檢查相關依賴"
            }, ensure_ascii=False)

        logger.info(f"🔄 {'預覽' if preview_only else '轉換'} Gmail CSV 格式: {input_file}")

        # 檢查文件是否存在
        import os
        if not os.path.exists(input_file):
            return json.dumps({
                "success": False,
                "error": f"文件不存在: {input_file}"
            }, ensure_ascii=False)

        if preview_only:
            # 只預覽轉換結果
            preview_result = preview_gmail_csv_conversion(input_file, num_rows=3)
            return json.dumps({
                "success": True,
                "preview": True,
                "original_columns": preview_result["original"]["columns"],
                "converted_columns": preview_result["converted"]["columns"],
                "sample_original": preview_result["original"]["sample_data"],
                "sample_converted": preview_result["converted"]["sample_data"],
                "changes": preview_result["changes"],
                "message": "預覽轉換結果，未實際修改文件"
            }, ensure_ascii=False)
        else:
            # 實際轉換文件
            result_file = convert_gmail_csv_format(input_file, output_file)
            return json.dumps({
                "success": True,
                "preview": False,
                "input_file": input_file,
                "output_file": result_file,
                "message": f"CSV 格式轉換完成，結果保存到: {result_file}"
            }, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ CSV 格式轉換失敗: {e}")
        return json.dumps({
            "success": False,
            "error": f"CSV 格式轉換失敗: {str(e)}"
        }, ensure_ascii=False)


# 獲取所有本地文件工具
def get_langchain_local_file_tools() -> List:
    """獲取所有 LangChain 兼容的本地文件工具"""
    tools = [
        # 基本文件操作工具
        read_file_with_summary_tool,
        edit_file_by_lines_tool,
        highlight_file_sections_tool,
        save_file_tool,
        create_file_tool,
        delete_file_tool,
        # 數據文件工具
        read_data_file_tool,
        edit_data_file_tool,
        # 數據分析工具
        get_data_info_tool,
        group_by_analysis_tool,
        threshold_analysis_tool,
        correlation_analysis_tool,
        linear_prediction_tool,
        # 新增的數據CRUD工具
        filter_data_tool,
        filter_and_analyze_tool,
        cleanup_temp_files_tool,
        get_session_data_status_tool,
        clear_session_data_tool,
        suggest_analysis_operation_tool,
        create_data_file_tool,
        update_data_rows_tool,
        delete_data_rows_tool,
        # ❌ analyze_combined_datasets_tool 已刪除，請使用新的多檔案工具
    ]

    # 添加多檔案分析工具
    if MULTI_FILE_TOOLS_AVAILABLE:
        tools.extend([
            multi_file_reader_tool,
            multi_file_filter_tool,
            multi_file_analyzer_tool,
            multi_file_data_analyzer_tool  # 新增：處理預處理數據的分析工具
        ])
        logger.info("✅ 多檔案分析工具已添加到工具列表")

    # 添加 Gmail 指紋搜尋工具（如果可用）
    if FINGERPRINT_SEARCH_AVAILABLE:
        tools.append(gmail_fingerprint_search_tool)
        logger.info("✅ Gmail 指紋搜尋工具已添加到工具列表")

    # 添加通用指紋搜尋工具（如果可用）
    if FLEXIBLE_FINGERPRINT_SEARCH_AVAILABLE:
        tools.append(fingerprint_search_tool)
        logger.info("✅ 通用指紋搜尋工具已添加到工具列表")

    # 添加 CSV 格式轉換工具（如果可用）
    if CSV_CONVERTER_AVAILABLE:
        tools.append(convert_gmail_csv_format_tool)
        logger.info("✅ CSV 格式轉換工具已添加到工具列表")

    # 添加擴展工具（如果可用）
    if EXTENDED_TOOLS_AVAILABLE:
        try:
            # 添加 Task Memory 工具
            tools.extend(get_langchain_task_memory_tools())
            logger.info("✅ Task Memory 工具已添加")

            # 繪圖工具已移除，專注於核心文件操作功能
            logger.info("⚠️ 繪圖工具已移除")

            # 添加智能批次處理工具
            tools.extend(get_batch_processor_tools())
            logger.info("✅ 智能批次處理工具已添加")

        except Exception as e:
            logger.warning(f"⚠️ 添加擴展工具失敗: {e}")

    return tools