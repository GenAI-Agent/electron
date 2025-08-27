"""
多檔案分析工具集
提供多檔案閱讀、過濾、綜合分析功能
"""

import os
import json
import asyncio
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# 初始化 LLM (使用第二組配置)
llm = AzureChatOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT_2"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY_2"),
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    temperature=0.4,
)

# 資料目錄
SANDBOX_DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "sandbox"

async def _text_search_filter(file_result: Dict[str, Any], filter_condition: str) -> Dict[str, Any]:
    """
    文字內容過濾函數 - 支持關鍵字搜尋和 fingerprint 匹配

    Args:
        file_result: 檔案讀取結果
        filter_condition: 過濾條件（自然語言或關鍵字）

    Returns:
        過濾結果
    """
    try:
        data = file_result.get("data", [])
        if not data:
            return {"success": False, "error": "無數據可過濾"}

        # 將過濾條件轉換為關鍵字列表
        keywords = []
        if "," in filter_condition:
            # 逗號分隔的關鍵字
            keywords = [k.strip() for k in filter_condition.split(",")]
        else:
            # 自然語言，提取關鍵字
            keywords = _extract_keywords(filter_condition)

        print(f"🔍 提取的關鍵字: {keywords}")

        # 對每行數據進行文字搜尋
        filtered_data = []
        for row in data:
            if _match_keywords(row, keywords):
                filtered_data.append(row)

        return {
            "success": True,
            "data": filtered_data,
            "original_rows": len(data),
            "filtered_rows": len(filtered_data),
            "columns": list(data[0].keys()) if data else [],
            "filter_keywords": keywords
        }

    except Exception as e:
        logger.error(f"文字搜尋過濾失敗: {e}")
        return {"success": False, "error": f"文字搜尋失敗: {str(e)}"}

def _extract_keywords(text: str) -> List[str]:
    """從自然語言中提取關鍵字"""
    # 教育相關關鍵字映射
    education_keywords = {
        "教育": ["教育", "學校", "老師", "學生", "課程", "教學", "學習", "考試", "成績", "畢業"],
        "醫療": ["醫療", "醫院", "醫生", "護士", "病人", "治療", "藥物", "健康", "疾病"],
        "科技": ["科技", "技術", "軟體", "硬體", "程式", "開發", "AI", "人工智慧", "電腦"],
        "政治": ["政治", "政府", "選舉", "政策", "法律", "議員", "市長", "總統", "立法"],
        "經濟": ["經濟", "金融", "投資", "股票", "銀行", "貿易", "商業", "企業", "市場"]
    }

    text_lower = text.lower()
    keywords = []

    # 檢查是否包含預定義的主題關鍵字
    for topic, topic_keywords in education_keywords.items():
        if topic in text or any(kw in text for kw in topic_keywords):
            keywords.extend(topic_keywords)
            break

    # 如果沒有匹配到預定義主題，直接使用原文作為關鍵字
    if not keywords:
        keywords = [text.strip()]

    return keywords

def _match_keywords(row: Dict[str, Any], keywords: List[str]) -> bool:
    """檢查數據行是否匹配關鍵字"""
    # 將所有欄位值轉換為字串並合併
    text_content = " ".join(str(value) for value in row.values()).lower()

    # 檢查是否包含任一關鍵字
    return any(keyword.lower() in text_content for keyword in keywords)

async def read_single_file_async(file_path: str, sample_size: int = 100) -> Dict[str, Any]:
    """異步讀取單個檔案"""
    try:
        # 處理相對路徑
        if not Path(file_path).is_absolute():
            if file_path.startswith("../data/sandbox/"):
                # 前端傳來的相對路徑
                filename = file_path.split("/")[-1]
                full_path = SANDBOX_DATA_DIR / filename
            else:
                full_path = SANDBOX_DATA_DIR / file_path
        else:
            full_path = Path(file_path)
        
        if not full_path.exists():
            return {
                "filename": str(file_path),
                "success": False,
                "error": f"檔案不存在: {file_path}"
            }
        
        # 讀取CSV檔案
        df = pd.read_csv(full_path, encoding='utf-8-sig')
        
        # 取樣本數據
        sample_data = df.head(sample_size).to_dict('records')
        
        # 計算統計
        stats = {
            "total_rows": len(df),
            "columns": list(df.columns),
            "sample_rows": len(sample_data),
            "file_size": full_path.stat().st_size,
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }
        
        return {
            "filename": str(file_path),
            "success": True,
            "data": sample_data,
            "stats": stats,
            "full_dataframe": df  # 保留完整數據框用於後續處理
        }
        
    except Exception as e:
        logger.error(f"讀取檔案失敗 {file_path}: {e}")
        return {
            "filename": str(file_path),
            "success": False,
            "error": str(e)
        }

@tool
async def multi_file_reader_tool(
    file_paths: str,
    sample_size: int = 100,
    session_id: str = "default"
) -> str:
    """
    多檔案閱讀工具 - 並行讀取多個檔案並返回基本統計和樣本數據

    Args:
        file_paths: 檔案路徑列表的JSON字符串，例如: ["file1.csv", "file2.csv"]
        sample_size: 每個檔案的樣本數據行數，默認100
        session_id: 會話ID

    Returns:
        讀取結果的JSON字符串
    """
    try:
        print(f"🔄 multi_file_reader_tool 開始執行")
        print(f"📥 接收到的 file_paths 參數: {file_paths}")
        print(f"📥 file_paths 類型: {type(file_paths)}")
        print(f"📥 sample_size: {sample_size}, session_id: {session_id}")

        logger.info(f"🔄 multi_file_reader_tool 開始執行")
        logger.info(f"📥 接收到的 file_paths 參數: {file_paths}")
        logger.info(f"📥 file_paths 類型: {type(file_paths)}")
        logger.info(f"📥 sample_size: {sample_size}, session_id: {session_id}")

        # 檢查 file_paths 參數
        if not file_paths:
            logger.error(f"❌ file_paths 參數為空")
            return json.dumps({
                "success": False,
                "error": "沒有提供檔案路徑。請先在 AI Sandbox 頁面選擇要分析的資料集。",
                "session_id": session_id,
                "user_action_required": "請先選擇資料集"
            }, ensure_ascii=False)

        # 解析檔案路徑
        if isinstance(file_paths, str):
            try:
                paths = json.loads(file_paths)
                logger.info(f"✅ JSON 解析成功: {paths}")
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON 解析失敗: {e}")
                return json.dumps({
                    "success": False,
                    "error": f"檔案路徑格式錯誤: {str(e)}。請確保提供正確的檔案路徑列表。",
                    "session_id": session_id
                }, ensure_ascii=False)
        else:
            paths = file_paths
            logger.info(f"✅ 直接使用路徑列表: {paths}")

        # 檢查路徑列表是否為空
        if not paths or len(paths) == 0:
            logger.error(f"❌ 檔案路徑列表為空")
            return json.dumps({
                "success": False,
                "error": "檔案路徑列表為空。請先在 AI Sandbox 頁面選擇要分析的資料集。",
                "session_id": session_id,
                "user_action_required": "請先選擇資料集"
            }, ensure_ascii=False)

        logger.info(f"📁 準備讀取 {len(paths)} 個檔案: {paths}")
        
        # 並行讀取所有檔案
        tasks = [read_single_file_async(path, sample_size) for path in paths]
        results = await asyncio.gather(*tasks)
        
        # 計算總體統計
        successful_files = [r for r in results if r["success"]]
        total_rows = sum(r["stats"]["total_rows"] for r in successful_files)
        
        summary = {
            "total_files": len(paths),
            "successful_files": len(successful_files),
            "failed_files": len(paths) - len(successful_files),
            "total_rows": total_rows,
            "sample_size": sample_size
        }
        
        # 移除完整數據框（避免序列化問題）
        for result in results:
            if "full_dataframe" in result:
                del result["full_dataframe"]
        
        response = {
            "success": True,
            "results": results,
            "summary": summary,
            "session_id": session_id
        }
        
        print(f"✅ 多檔案讀取完成: {len(successful_files)}/{len(paths)} 成功")
        logger.info(f"✅ 多檔案讀取完成: {len(successful_files)}/{len(paths)} 成功")

        # 🔧 確保所有數據都可以 JSON 序列化
        try:
            result_json = json.dumps(response, ensure_ascii=False)
            print(f"✅ JSON 序列化成功")
            return result_json
        except TypeError as e:
            print(f"❌ JSON 序列化失敗: {e}")
            print(f"❌ 問題可能在 response 中的某個字段")
            logger.error(f"❌ JSON 序列化失敗: {e}")

            # 檢查每個結果中的問題字段
            for i, result in enumerate(results):
                try:
                    json.dumps(result)
                except TypeError as result_error:
                    print(f"❌ 結果 {i} 序列化失敗: {result_error}")
                    print(f"❌ 結果 {i} 的 keys: {list(result.keys())}")

            # 返回簡化版本
            simplified_response = {
                "success": True,
                "message": f"成功讀取 {len(successful_files)}/{len(paths)} 個檔案",
                "summary": summary,
                "session_id": session_id
            }
            return json.dumps(simplified_response, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 多檔案讀取失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e),
            "session_id": session_id
        }, ensure_ascii=False)

@tool
async def multi_file_filter_tool(
    file_paths: str,
    filter_condition: str,
    sample_size: int = 1000,
    session_id: str = "default"
) -> str:
    """
    多檔案過濾工具 - 使用條件過濾多個檔案的數據

    Args:
        file_paths: 檔案路徑列表的JSON字符串
        filter_condition: 過濾條件，支持：
                         1. 自然語言: "跟教育有關的資料"
                         2. 結構化條件: {"column": "age", "operator": ">", "value": 30}
                         3. 關鍵字搜尋: "教育,學校,老師"
        sample_size: 每個檔案的處理行數，默認1000
        session_id: 會話ID

    Returns:
        過濾結果的JSON字符串
    """
    try:
        print(f"🔄 multi_file_filter_tool 開始執行")
        print(f"📥 接收到的 file_paths: {file_paths}")
        print(f"🔍 過濾條件: {filter_condition}")
        print(f"📥 sample_size: {sample_size}")

        logger.info(f"🔄 multi_file_filter_tool 開始執行")
        logger.info(f"📥 接收到的 file_paths: {file_paths}")
        logger.info(f"📥 file_paths 類型: {type(file_paths)}")
        logger.info(f"🔍 過濾條件: {filter_condition}")
        logger.info(f"📥 sample_size: {sample_size}, session_id: {session_id}")

        # 檢查 file_paths 參數
        if not file_paths:
            logger.error(f"❌ file_paths 參數為空")
            return json.dumps({
                "success": False,
                "error": "沒有提供檔案路徑。請先在 AI Sandbox 頁面選擇要分析的資料集。",
                "session_id": session_id,
                "user_action_required": "請先選擇資料集"
            }, ensure_ascii=False)
        
        if not llm:
            return json.dumps({
                "success": False,
                "error": "LLM 不可用，無法執行過濾",
                "session_id": session_id
            }, ensure_ascii=False)
        
        # 解析檔案路徑
        paths = json.loads(file_paths) if isinstance(file_paths, str) else file_paths
        
        print(f"📁 準備過濾 {len(paths)} 個檔案")

        # 🔧 使用現有的 filter_data_tool 進行過濾
        from supervisor_agent.tools.langchain_local_file_tools import filter_data_tool

        filtered_results = []
        for path in paths:
            try:
                print(f"🔍 過濾檔案: {path}")
                print(f"🔍 過濾條件: {filter_condition}")

                # 先讀取檔案以判斷數據類型
                file_result = await read_single_file_async(path, 10)  # 先讀取少量數據判斷類型

                if not file_result["success"]:
                    filtered_results.append({
                        "filename": path,
                        "success": False,
                        "error": file_result.get("error", "讀取失敗")
                    })
                    continue

                # 判斷過濾類型
                sample_data = file_result.get("data", [])
                if not sample_data:
                    filtered_results.append({
                        "filename": path,
                        "success": False,
                        "error": "檔案無數據"
                    })
                    continue

                # 智能判斷過濾方式
                if filter_condition.startswith("{") and filter_condition.endswith("}"):
                    # 結構化條件：使用 filter_data_tool
                    filter_result_str = await filter_data_tool(
                        file_path=path,
                        filter_conditions=filter_condition,
                        session_id=session_id,
                        save_filtered_data=False
                    )
                    filter_result = json.loads(filter_result_str)
                else:
                    # 自然語言/關鍵字條件：使用文字搜尋
                    filter_result = await _text_search_filter(file_result, filter_condition)

                if filter_result.get("success", False):
                    print(f"✅ 過濾成功: {path}")
                    filtered_results.append({
                        "filename": path,
                        "success": True,
                        "data": filter_result.get("data", []),
                        "original_rows": filter_result.get("original_rows", 0),
                        "filtered_rows": len(filter_result.get("data", [])),
                        "filter_condition": filter_condition,
                        "stats": {
                            "total_rows": len(filter_result.get("data", [])),
                            "columns": filter_result.get("columns", [])
                        }
                    })
                else:
                    print(f"❌ 過濾失敗: {path}")
                    filtered_results.append({
                        "filename": path,
                        "success": False,
                        "error": f"過濾失敗: {filter_result.get('error', '未知錯誤')}"
                    })
            except Exception as e:
                print(f"❌ 過濾異常: {path} - {e}")
                logger.error(f"過濾檔案失敗 {path}: {e}")
                filtered_results.append({
                    "filename": path,
                    "success": False,
                    "error": f"過濾失敗: {str(e)}"
                })
        
        # 計算過濾統計
        successful_results = [r for r in filtered_results if r["success"]]
        total_original_rows = sum(r.get("original_rows", 0) for r in successful_results)
        total_filtered_rows = sum(r.get("filtered_rows", 0) for r in successful_results)

        print(f"📊 過濾統計: {len(successful_results)}/{len(paths)} 檔案成功")
        print(f"📊 數據統計: {total_original_rows} → {total_filtered_rows} 行")

        summary = {
            "total_files": len(paths),
            "successful_files": len(successful_results),
            "failed_files": len(paths) - len(successful_results),
            "total_original_rows": total_original_rows,
            "total_filtered_rows": total_filtered_rows,
            "filter_condition": filter_condition,
            "filter_rate": f"{(total_filtered_rows/total_original_rows*100):.1f}%" if total_original_rows > 0 else "0%"
        }
        
        response = {
            "success": True,
            "results": filtered_results,
            "summary": summary,
            "session_id": session_id
        }
        
        logger.info(f"✅ 多檔案過濾完成: {len(successful_results)}/{len(paths)} 成功")
        return json.dumps(response, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 多檔案過濾失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e),
            "session_id": session_id
        }, ensure_ascii=False)

@tool
async def multi_file_analyzer_tool(
    file_paths: str,
    analysis_type: str = "summary",
    analysis_question: str = None,
    session_id: str = "default"
) -> str:
    """
    多檔案綜合分析工具 - 對多個檔案進行跨檔案的綜合分析

    Args:
        file_paths: 檔案路徑列表的JSON字符串
        analysis_type: 分析類型，可選: "summary"(摘要), "trend"(趨勢), "comparison"(對比), "statistics"(統計)
        analysis_question: 具體分析問題，例如: "比較不同資料源的討論主題差異"
        session_id: 會話ID

    Returns:
        分析結果的JSON字符串
    """
    try:
        print(f"🔄 multi_file_analyzer_tool 開始執行")
        print(f"📊 分析類型: {analysis_type}")
        print(f"❓ 分析問題: {analysis_question}")

        logger.info(f"🔄 multi_file_analyzer_tool 開始執行")
        logger.info(f"📊 分析類型: {analysis_type}")
        logger.info(f"❓ 分析問題: {analysis_question}")

        # 檢查 file_paths 參數
        if not file_paths:
            logger.error(f"❌ file_paths 參數為空")
            return json.dumps({
                "success": False,
                "error": "沒有提供檔案路徑。請先在 AI Sandbox 頁面選擇要分析的資料集。",
                "session_id": session_id,
                "user_action_required": "請先選擇資料集"
            }, ensure_ascii=False)

        if not llm:
            return json.dumps({
                "success": False,
                "error": "LLM 不可用，無法執行分析",
                "session_id": session_id
            }, ensure_ascii=False)

        # 解析檔案路徑
        paths = json.loads(file_paths) if isinstance(file_paths, str) else file_paths

        # 讀取所有檔案（用更多樣本進行分析）
        file_results = []
        for path in paths:
            result = await read_single_file_async(path, 200)  # 分析用更多樣本

            # 🔧 移除 DataFrame 以避免 JSON 序列化問題
            if "full_dataframe" in result:
                del result["full_dataframe"]
                print(f"🔧 已移除 {path} 的 DataFrame")

            file_results.append(result)

        # 準備分析數據
        analysis_data = []
        for result in file_results:
            if result["success"] and result["data"]:
                analysis_data.append({
                    "filename": result["filename"],
                    "stats": result["stats"],
                    "sample_data": result["data"][:20],  # 取前20筆作為分析樣本
                    "total_rows": result["stats"]["total_rows"],
                    "columns": result["stats"]["columns"]
                })

        if not analysis_data:
            return json.dumps({
                "success": False,
                "error": "沒有可用的數據進行分析",
                "session_id": session_id
            }, ensure_ascii=False)

        # 構建分析prompt
        analysis_prompt = f"""
你是一個專業的數據分析師。請對以下多個數據集進行{analysis_type}分析。

數據集資訊：
{json.dumps(analysis_data, ensure_ascii=False, indent=2)}

分析類型：{analysis_type}
"""

        if analysis_question:
            analysis_prompt += f"\n具體分析問題：{analysis_question}"

        analysis_prompt += """

請提供詳細的分析報告，包含：
1. **數據概覽** - 各數據集的基本情況
2. **主要發現** - 關鍵洞察和發現
3. **詳細分析** - 根據分析類型進行深入分析：
   - summary: 提供各數據集的摘要和特點
   - trend: 分析數據的趨勢變化
   - comparison: 對比不同數據集的差異和相似性
   - statistics: 提供統計分析和數據分佈
4. **結論和建議** - 基於分析的結論和行動建議

請用繁體中文回答，並提供具體的數據支持。格式要清晰易讀。
"""

        # 調用LLM進行分析
        response = await llm.ainvoke([{"role": "user", "content": analysis_prompt}])
        analysis_result = response.content

        # 計算統計
        successful_files = len(analysis_data)
        total_rows = sum(data["total_rows"] for data in analysis_data)

        summary = {
            "total_files": len(paths),
            "successful_files": successful_files,
            "failed_files": len(paths) - successful_files,
            "total_rows": total_rows,
            "analysis_type": analysis_type,
            "analysis_question": analysis_question
        }

        response_data = {
            "success": True,
            "results": file_results,
            "summary": summary,
            "analysis": analysis_result,
            "session_id": session_id
        }

        print(f"✅ 多檔案分析完成: {successful_files}/{len(paths)} 檔案成功分析")
        logger.info(f"✅ 多檔案分析完成: {successful_files}/{len(paths)} 檔案成功分析")

        # 🔧 安全的 JSON 序列化檢查
        try:
            result_json = json.dumps(response_data, ensure_ascii=False)
            print(f"✅ JSON 序列化成功")
            return result_json
        except TypeError as json_error:
            print(f"❌ JSON 序列化失敗: {json_error}")
            # 檢查哪個結果有問題
            for i, result in enumerate(file_results):
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
            result_json = json.dumps(response_data, ensure_ascii=False)
            print(f"✅ 清理後 JSON 序列化成功")
            return result_json

    except Exception as e:
        logger.error(f"❌ 多檔案分析失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e),
            "session_id": session_id
        }, ensure_ascii=False)


@tool
async def multi_file_data_analyzer_tool(
    files_data: str,
    analysis_question: str,
    session_id: str = "default"
) -> str:
    """
    基於預處理的多檔案數據進行分析

    Args:
        files_data: 預處理的檔案數據 JSON 字符串
        analysis_question: 分析問題
        session_id: 會話ID

    Returns:
        分析結果的JSON字符串
    """
    try:
        print(f"🔄 multi_file_data_analyzer_tool 開始執行")
        print(f"📊 分析問題: {analysis_question}")
        print(f"📥 收到的 files_data 類型: {type(files_data)}")
        print(f"📥 files_data 長度: {len(str(files_data))}")
        print(f"📥 files_data 前100字符: {str(files_data)[:100]}...")

        # 解析預處理的檔案數據
        if isinstance(files_data, str):
            if not files_data.strip():
                print(f"❌ files_data 是空字符串")
                return json.dumps({
                    "success": False,
                    "error": "files_data 參數為空",
                    "session_id": session_id
                }, ensure_ascii=False)
            data = json.loads(files_data)
        else:
            data = files_data

        print(f"📁 收到預處理數據，包含 {len(data.get('results', []))} 個檔案")

        if not data.get("success"):
            return json.dumps({
                "success": False,
                "error": "預處理數據無效",
                "session_id": session_id
            }, ensure_ascii=False)

        # 提取所有檔案的數據進行分析
        all_data = []
        file_summaries = []

        print(f"🔍 檢查數據結構...")
        for i, result in enumerate(data.get("results", [])):
            print(f"📄 檔案 {i}: {result.get('filename', 'unknown')}")
            print(f"   - success: {result.get('success')}")
            print(f"   - keys: {list(result.keys())}")

            if result.get("success"):
                filename = result.get("filename", "unknown")
                platform_name = result.get("platform_name", "Unknown")
                platform_type = result.get("platform_type", "未知平台")

                # 🔧 適配新的數據結構：使用 data_summary 而不是 data
                data_summary = result.get("data_summary", {})
                sample_data = result.get("sample_data", [])
                total_rows = result.get("total_rows", 0)
                columns = result.get("columns", [])

                print(f"   - platform: {platform_name} ({platform_type})")
                print(f"   - total_rows: {total_rows}")
                print(f"   - sample_data 長度: {len(sample_data)}")

                # 🎯 重點：使用統計摘要而不是樣本數據進行分析
                # sample_data 只是少量樣本，真正的分析應該基於 data_summary 中的統計信息
                all_data.extend(sample_data)  # 保留樣本用於展示

                # 提取詳細的統計信息
                column_stats = data_summary.get("column_stats", {})
                numeric_columns = data_summary.get("numeric_columns", [])
                categorical_columns = data_summary.get("categorical_columns", [])

                file_summaries.append({
                    "filename": filename,
                    "platform_name": platform_name,
                    "platform_type": platform_type,
                    "total_rows": total_rows,  # 真實的總行數
                    "columns": columns,
                    "sample_data": sample_data[:1] if sample_data else [],  # 只保留1行樣本用於格式參考
                    "sample_note": f"以上僅為1行樣本用於格式參考，實際數據有 {total_rows} 行",
                    "numeric_columns": numeric_columns,
                    "categorical_columns": categorical_columns,
                    "column_statistics": column_stats,  # 詳細的欄位統計
                    "data_shape": data_summary.get("data_shape", [total_rows, len(columns)])
                })

                print(f"   - 統計摘要包含 {len(column_stats)} 個欄位的詳細統計")

        # 計算真實的總行數（基於統計摘要）
        actual_total_rows = sum(summary.get("total_rows", 0) for summary in file_summaries)
        print(f"📊 數據摘要：{len(file_summaries)} 個檔案，實際總行數 {actual_total_rows} 行")
        print(f"📊 樣本數據：{len(all_data)} 行樣本用於展示")

        # 使用 LLM 進行分析
        if not llm:
            return json.dumps({
                "success": False,
                "error": "LLM 不可用，無法執行分析",
                "session_id": session_id
            }, ensure_ascii=False)

        # 構建分析 prompt
        analysis_prompt = f"""
基於以下多檔案統計摘要回答問題：{analysis_question}

## 重要說明：
以下數據包含完整的統計摘要信息，每個檔案的 total_rows 是真實的數據行數，sample_data 只是少量樣本用於展示。
請基於 column_statistics 中的詳細統計信息進行分析，而不是僅看樣本數據。

## 檔案統計摘要：
{json.dumps(file_summaries, ensure_ascii=False, indent=2)}

## 分析要求：
請提供詳細的比較分析，包括：

### 1. 平台基本特徵對比
- 數據規模：各平台的實際數據量（total_rows）
- 欄位結構：數值欄位 vs 分類欄位的差異
- 平台類型：社群討論串 vs PTT論壇 的本質差異

### 2. 數值欄位統計對比
- 基於 column_statistics 中的 mean, std, min, max 進行比較
- 例如：關注數、瀏覽數、年齡等數值欄位的分布差異
- 指出哪個平台的用戶更活躍、參與度更高

### 3. 分類欄位分布對比
- 基於 column_statistics 中的 top_values 進行比較
- 例如：地區分布、性別比例、主題標籤的差異
- 分析用戶群體特徵和內容偏好

### 4. 具體差異分析
- 回答用戶的具體問題
- 提供具體的統計數字作為支持
- 指出最顯著的差異點和特色

### 5. 結論和洞察
- 總結兩個平台的主要差異
- 提供基於數據的深入洞察
- 給出使用建議或趨勢分析

請用繁體中文回答，使用清晰的格式，並引用具體的統計數據。
"""

        print(f"🤖 調用 LLM 進行分析...")
        analysis_result = await llm.ainvoke(analysis_prompt)

        response = {
            "success": True,
            "analysis": analysis_result.content if hasattr(analysis_result, 'content') else str(analysis_result),
            "file_summaries": file_summaries,
            "total_rows": len(all_data),
            "total_files": len(file_summaries),
            "session_id": session_id
        }

        print(f"✅ 多檔案數據分析完成")
        return json.dumps(response, ensure_ascii=False)

    except Exception as e:
        print(f"❌ 多檔案數據分析失敗: {e}")
        logger.error(f"❌ 多檔案數據分析失敗: {e}")
        return json.dumps({
            "success": False,
            "error": f"多檔案數據分析失敗: {str(e)}",
            "session_id": session_id
        }, ensure_ascii=False)

# 導出工具列表
MULTI_FILE_TOOLS = [
    multi_file_reader_tool,
    multi_file_filter_tool,
    multi_file_analyzer_tool
]
