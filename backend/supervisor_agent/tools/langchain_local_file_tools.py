"""
LangChain 兼容的本地文件工具
提供標準的 LangChain tool 格式
"""

import logging
import sys
from pathlib import Path
from typing import Dict, Any, List
from langchain_core.tools import tool

# 添加 src 目錄到路徑以導入工具
current_dir = Path(__file__).parent
src_dir = current_dir.parent.parent / "src"
sys.path.insert(0, str(src_dir))

# 導入原始工具函數
from tools.local_file_tools import local_file_tools
from tools.data_file_tools import data_file_tools
from tools.data_analysis_tools import data_analysis_tools

logger = logging.getLogger(__name__)

# 導入新的工具模組
# 初始化擴展工具函數
get_langchain_task_memory_tools = lambda: []
get_langchain_plotting_tools = lambda: []
get_batch_processor_tools = lambda: []

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
            spec = importlib.util.spec_from_file_location("batch_processor_tool", batch_path)
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
async def read_file_with_summary_tool(file_path: str, session_id: str = "default") -> str:
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
async def edit_file_by_lines_tool(file_path: str, start_line: int, end_line: int, 
                                 new_content: str, session_id: str = "default") -> str:
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
        result = await local_file_tools.edit_file_by_lines(file_path, start_line, end_line, new_content, session_id)
        return str(result)
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

    try:
        # 步驟1: 檢查文件存在性
        import os
        from pathlib import Path
        logger.info(f"📋 步驟1: 檢查文件是否存在")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        file_size = os.path.getsize(file_path)
        file_ext = Path(file_path).suffix.lower()
        logger.info(f"✓ 文件存在，大小: {file_size} bytes，副檔名: {file_ext}")

        # 步驟2: 判斷文件類型
        logger.info(f"📋 步驟2: 判斷文件類型")
        data_file_extensions = ['.csv', '.json', '.xlsx', '.xls', '.parquet']
        text_file_extensions = ['.txt', '.md', '.py', '.js', '.html', '.css', '.xml', '.yaml', '.yml']

        if file_ext in data_file_extensions:
            # 數據文件 - 使用數據分析工具
            logger.info(f"📊 識別為數據文件，使用數據分析工具")
            result = await data_analysis_tools.get_data_info(file_path, session_id)

        elif file_ext in text_file_extensions:
            # 文本文件 - 使用文件讀取工具生成摘要
            logger.info(f"📄 識別為文本文件，使用文件讀取工具")
            file_summary = await local_file_tools.read_file_with_summary(file_path, session_id)

            # 轉換為統一格式
            result = {
                "success": True,
                "file_type": "text_file",
                "file_path": file_path,
                "file_size": file_size,
                "file_extension": file_ext,
                "summary": file_summary,
                "analysis_type": "text_file_summary"
            }

        else:
            # 未知文件類型 - 嘗試作為文本文件處理
            logger.info(f"⚠️ 未知文件類型 {file_ext}，嘗試作為文本文件處理")
            try:
                file_summary = await local_file_tools.read_file_with_summary(file_path, session_id)
                result = {
                    "success": True,
                    "file_type": "unknown_text_file",
                    "file_path": file_path,
                    "file_size": file_size,
                    "file_extension": file_ext,
                    "summary": file_summary,
                    "analysis_type": "text_file_summary",
                    "warning": f"未知文件類型 {file_ext}，已作為文本文件處理"
                }
            except Exception as text_error:
                # 完全無法處理
                result = {
                    "success": False,
                    "error": f"無法處理文件類型 {file_ext}，既不是支持的數據格式，也無法作為文本文件讀取: {str(text_error)}",
                    "file_path": file_path,
                    "file_extension": file_ext,
                    "supported_data_formats": data_file_extensions,
                    "supported_text_formats": text_file_extensions
                }

        # 步驟3: 處理結果
        logger.info(f"📋 步驟3: 處理分析結果")
        result_str = str(result)

        # 記錄輸出
        logger.info(f"📤 輸出結果長度: {len(result_str)} 字符")
        if isinstance(result, dict) and result.get('success'):
            if result.get('file_type') == 'text_file':
                logger.info(f"📄 文本文件摘要已生成")
            else:
                data_shape = result.get('data_shape', [0, 0])
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
async def group_by_analysis_tool(file_path: str, group_column: str, value_column: str,
                                operation: str = "sum", session_id: str = "default") -> str:
    """
    通用分組分析工具
    
    Args:
        file_path: 數據文件路徑
        group_column: 分組列名
        value_column: 數值列名
        operation: 操作類型 (mean, sum, count, min, max)
        session_id: 會話ID
        
    Returns:
        分組分析結果的JSON字符串
    """
    try:
        result = await data_analysis_tools.group_by_analysis(file_path, group_column, value_column, operation, session_id)
        return str(result)
    except Exception as e:
        logger.error(f"❌ 分組分析失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def threshold_analysis_tool(file_path: str, value_column: str, threshold: float, 
                                 comparison: str = "greater", session_id: str = "default") -> str:
    """
    通用閾值分析工具
    
    Args:
        file_path: 數據文件路徑
        value_column: 數值列名
        threshold: 閾值
        comparison: 比較方式 (greater, less, equal)
        session_id: 會話ID
        
    Returns:
        閾值分析結果的JSON字符串
    """
    try:
        result = await data_analysis_tools.threshold_analysis(file_path, value_column, threshold, comparison, session_id)
        return str(result)
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
        result = await data_file_tools.read_data_file(file_path, session_id)
        return str(result)
    except Exception as e:
        logger.error(f"❌ 讀取數據文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def filter_data_tool(file_path: str, filter_conditions: str, session_id: str = "default") -> str:
    """
    根據條件過濾數據文件

    Args:
        file_path: 數據文件路徑
        filter_conditions: 過濾條件的JSON字符串，例如: {"column": "age", "operator": ">", "value": 25}
        session_id: 會話ID

    Returns:
        過濾後的數據JSON字符串
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

        if file_ext == '.csv':
            df = pd.read_csv(file_path)
        elif file_ext == '.json':
            df = pd.read_json(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            return f'{{"success": false, "error": "不支持的文件格式: {file_ext}"}}'

        # 應用過濾條件
        if isinstance(conditions, dict):
            conditions = [conditions]  # 轉換為列表

        filtered_df = df.copy()

        for condition in conditions:
            column = condition.get('column')
            operator = condition.get('operator')
            value = condition.get('value')

            if column not in filtered_df.columns:
                continue

            if operator == '>':
                filtered_df = filtered_df[filtered_df[column] > value]
            elif operator == '<':
                filtered_df = filtered_df[filtered_df[column] < value]
            elif operator == '>=':
                filtered_df = filtered_df[filtered_df[column] >= value]
            elif operator == '<=':
                filtered_df = filtered_df[filtered_df[column] <= value]
            elif operator == '==':
                filtered_df = filtered_df[filtered_df[column] == value]
            elif operator == '!=':
                filtered_df = filtered_df[filtered_df[column] != value]
            elif operator == 'contains':
                filtered_df = filtered_df[filtered_df[column].str.contains(str(value), na=False)]
            elif operator == 'in':
                filtered_df = filtered_df[filtered_df[column].isin(value)]

        # 返回結果
        result = {
            "success": True,
            "original_rows": len(df),
            "filtered_rows": len(filtered_df),
            "data": filtered_df.to_dict('records'),
            "columns": list(filtered_df.columns),
            "filter_conditions": conditions
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 數據過濾失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def create_data_file_tool(file_path: str, data: str, file_type: str = "csv", session_id: str = "default") -> str:
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
            df.to_json(file_path, orient='records', ensure_ascii=False, indent=2)
        elif file_type.lower() == 'xlsx':
            df.to_excel(file_path, index=False)
        else:
            return f'{{"success": false, "error": "不支持的文件類型: {file_type}"}}'

        result = {
            "success": True,
            "file_path": file_path,
            "file_type": file_type,
            "rows_created": len(df),
            "columns": list(df.columns)
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 創建數據文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def update_data_rows_tool(file_path: str, update_conditions: str, new_values: str, session_id: str = "default") -> str:
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

        if file_ext == '.csv':
            df = pd.read_csv(file_path)
        elif file_ext == '.json':
            df = pd.read_json(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            return f'{{"success": false, "error": "不支持的文件格式: {file_ext}"}}'

        # 應用更新條件
        mask = pd.Series([True] * len(df))

        for condition in conditions:
            column = condition.get('column')
            operator = condition.get('operator')
            value = condition.get('value')

            if column not in df.columns:
                continue

            if operator == '==':
                mask &= (df[column] == value)
            elif operator == '!=':
                mask &= (df[column] != value)
            elif operator == '>':
                mask &= (df[column] > value)
            elif operator == '<':
                mask &= (df[column] < value)
            elif operator == 'contains':
                mask &= df[column].str.contains(str(value), na=False)

        # 更新數據
        updated_rows = mask.sum()

        for column, new_value in values.items():
            if column in df.columns:
                df.loc[mask, column] = new_value

        # 保存文件
        if file_ext == '.csv':
            df.to_csv(file_path, index=False, encoding='utf-8')
        elif file_ext == '.json':
            df.to_json(file_path, orient='records', ensure_ascii=False, indent=2)
        elif file_ext == '.xlsx':
            df.to_excel(file_path, index=False)

        result = {
            "success": True,
            "file_path": file_path,
            "updated_rows": int(updated_rows),
            "total_rows": len(df),
            "update_conditions": conditions,
            "new_values": values
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 更新數據失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def delete_data_rows_tool(file_path: str, delete_conditions: str, session_id: str = "default") -> str:
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

        if file_ext == '.csv':
            df = pd.read_csv(file_path)
        elif file_ext == '.json':
            df = pd.read_json(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            return f'{{"success": false, "error": "不支持的文件格式: {file_ext}"}}'

        original_rows = len(df)

        # 應用刪除條件
        mask = pd.Series([False] * len(df))

        for condition in conditions:
            column = condition.get('column')
            operator = condition.get('operator')
            value = condition.get('value')

            if column not in df.columns:
                continue

            if operator == '==':
                mask |= (df[column] == value)
            elif operator == '!=':
                mask |= (df[column] != value)
            elif operator == '>':
                mask |= (df[column] > value)
            elif operator == '<':
                mask |= (df[column] < value)
            elif operator == 'contains':
                mask |= df[column].str.contains(str(value), na=False)

        # 刪除數據
        df_filtered = df[~mask]
        deleted_rows = original_rows - len(df_filtered)

        # 保存文件
        if file_ext == '.csv':
            df_filtered.to_csv(file_path, index=False, encoding='utf-8')
        elif file_ext == '.json':
            df_filtered.to_json(file_path, orient='records', ensure_ascii=False, indent=2)
        elif file_ext == '.xlsx':
            df_filtered.to_excel(file_path, index=False)

        result = {
            "success": True,
            "file_path": file_path,
            "deleted_rows": int(deleted_rows),
            "remaining_rows": len(df_filtered),
            "original_rows": original_rows,
            "delete_conditions": conditions
        }

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        logger.error(f"❌ 刪除數據失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

# 添加更多工具
@tool
async def highlight_file_sections_tool(file_path: str, ranges: str, session_id: str = "default") -> str:
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
        result = await local_file_tools.highlight_file_sections(file_path, ranges_list, session_id)
        return str(result)
    except Exception as e:
        logger.error(f"❌ 高亮文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def save_file_tool(file_path: str, content: str, encoding: str = "utf-8", session_id: str = "default") -> str:
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
        result = await local_file_tools.save_file(file_path, content, encoding, session_id)
        return str(result)
    except Exception as e:
        logger.error(f"❌ 保存文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def create_file_tool(file_path: str, content: str = "", encoding: str = "utf-8", session_id: str = "default") -> str:
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
        result = await local_file_tools.create_file(file_path, content, encoding, session_id)
        return str(result)
    except Exception as e:
        logger.error(f"❌ 創建文件失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def correlation_analysis_tool(file_path: str, x_column: str, y_column: str, session_id: str = "default") -> str:
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
        result = await data_analysis_tools.correlation_analysis(file_path, x_column, y_column, session_id)
        return str(result)
    except Exception as e:
        logger.error(f"❌ 相關性分析失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def linear_prediction_tool(file_path: str, x_column: str, y_column: str, target_x_value: float, session_id: str = "default") -> str:
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
        result = await data_analysis_tools.linear_prediction(file_path, x_column, y_column, target_x_value, session_id)
        return str(result)
    except Exception as e:
        logger.error(f"❌ 線性預測失敗: {e}")
        return f'{{"success": false, "error": "{str(e)}"}}'

@tool
async def edit_data_file_tool(file_path: str, operation: str, data: str, session_id: str = "default") -> str:
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
        valid_operations = ['add_row', 'delete_row', 'update_cell', 'update_row']
        if operation not in valid_operations:
            raise ValueError(f"不支持的操作類型: {operation}，支持的操作: {valid_operations}")
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
        result = await data_file_tools.edit_data_file(file_path, operation, data, session_id)

        # 步驟4: 處理結果
        logger.info(f"📋 步驟4: 處理編輯結果")
        result_str = str(result)

        # 記錄輸出
        logger.info(f"📤 輸出結果長度: {len(result_str)} 字符")
        if isinstance(result, dict) and result.get('success'):
            logger.info(f"✅ 編輯操作成功完成")
            if 'affected_rows' in result:
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
        create_data_file_tool,
        update_data_rows_tool,
        delete_data_rows_tool,
    ]

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
