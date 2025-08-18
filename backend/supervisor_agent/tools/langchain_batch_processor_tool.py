"""
智能批次處理工具

這個工具讓 Supervisor Agent 可以自動識別和處理需要批次處理的任務。
"""

import json
import asyncio
from typing import Dict, Any, List, Optional, Callable
from langchain_core.tools import tool

from ...src.task_memory.task_memory_manager import TaskMemoryManager
from ..utils.logger import get_logger

logger = get_logger(__name__)

# 全局 Task Memory Manager 實例
task_memory_manager = TaskMemoryManager()


@tool
async def smart_batch_processor_tool(
    session_id: str,
    task_description: str,
    data_items: List[Any],
    processing_instruction: str,
    batch_size: int = 50
) -> str:
    """
    智能批次處理工具 - 自動處理大量數據的核心工具
    
    這個工具會自動：
    1. 創建批次任務
    2. 循環處理每個批次
    3. 保存中間結果到 tmp 空間
    4. 累積所有 tool results
    5. 生成最終報告
    
    Args:
        session_id: 會話ID
        task_description: 任務描述（如"分析客戶購買模式"）
        data_items: 要處理的數據項目列表
        processing_instruction: 每個項目的處理指令
        batch_size: 每批處理的數量，默認50
        
    Returns:
        處理結果的JSON字符串
    """
    try:
        total_items = len(data_items)
        task_id = f"batch_task_{session_id}_{hash(task_description) % 10000}"
        
        logger.info(f"🚀 開始智能批次處理: {task_description}")
        logger.info(f"📊 總項目數: {total_items}, 批次大小: {batch_size}")
        
        # 步驟1: 創建批次任務
        task_info = await task_memory_manager.create_batch_task(
            session_id=session_id,
            task_id=task_id,
            items=data_items,
            batch_size=batch_size
        )
        
        # 步驟2: 初始化結果累積器
        accumulated_results = []
        batch_summaries = []
        total_success = 0
        total_errors = 0
        
        # 步驟3: 循環處理每個批次
        total_batches = (total_items + batch_size - 1) // batch_size
        
        for batch_num in range(1, total_batches + 1):
            start_idx = (batch_num - 1) * batch_size
            end_idx = min(start_idx + batch_size, total_items)
            current_batch = data_items[start_idx:end_idx]
            
            logger.info(f"🔄 處理批次 {batch_num}/{total_batches} (項目 {start_idx+1}-{end_idx})")
            
            try:
                # 處理當前批次
                batch_results = await _process_single_batch(
                    batch_data=current_batch,
                    batch_number=batch_num,
                    processing_instruction=processing_instruction,
                    task_description=task_description
                )
                
                # 累積結果
                accumulated_results.extend(batch_results["items"])
                batch_summaries.append(batch_results["summary"])
                total_success += batch_results["success_count"]
                total_errors += batch_results["error_count"]
                
                # 保存中間結果到 tmp 空間
                await task_memory_manager.storage.save_temp_data(
                    session_id, 
                    f"batch_{batch_num}_results",
                    {
                        "batch_number": batch_num,
                        "items_processed": len(current_batch),
                        "results": batch_results["items"],
                        "summary": batch_results["summary"],
                        "timestamp": batch_results["timestamp"]
                    }
                )
                
                # 保存累積結果
                await task_memory_manager.storage.save_temp_data(
                    session_id,
                    f"accumulated_results_{task_id}",
                    {
                        "total_processed": end_idx,
                        "total_items": total_items,
                        "completion_percentage": (end_idx / total_items) * 100,
                        "accumulated_results": accumulated_results,
                        "batch_summaries": batch_summaries,
                        "success_count": total_success,
                        "error_count": total_errors
                    }
                )
                
                logger.info(f"✅ 批次 {batch_num} 完成: {batch_results['success_count']} 成功, {batch_results['error_count']} 失敗")
                
            except Exception as e:
                logger.error(f"❌ 批次 {batch_num} 處理失敗: {e}")
                total_errors += len(current_batch)
                
                # 保存錯誤信息
                await task_memory_manager.storage.save_temp_data(
                    session_id,
                    f"batch_{batch_num}_error",
                    {
                        "batch_number": batch_num,
                        "error": str(e),
                        "failed_items": len(current_batch)
                    }
                )
        
        # 步驟4: 生成最終報告
        final_report = {
            "task_description": task_description,
            "total_items": total_items,
            "total_batches": total_batches,
            "batch_size": batch_size,
            "success_count": total_success,
            "error_count": total_errors,
            "success_rate": (total_success / total_items) * 100 if total_items > 0 else 0,
            "batch_summaries": batch_summaries,
            "accumulated_results": accumulated_results[:100],  # 只返回前100個結果，完整結果在 tmp 中
            "results_location": f"accumulated_results_{task_id}",
            "completion_status": "completed"
        }
        
        # 保存最終報告
        await task_memory_manager.storage.save_temp_data(
            session_id,
            f"final_report_{task_id}",
            final_report
        )
        
        logger.info(f"🎉 批次處理完成: {total_success}/{total_items} 成功")
        
        return json.dumps({
            "success": True,
            "task_id": task_id,
            "report": final_report,
            "message": f"批次處理完成！成功處理 {total_success}/{total_items} 項目 ({final_report['success_rate']:.1f}%)"
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 智能批次處理失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


async def _process_single_batch(
    batch_data: List[Any],
    batch_number: int,
    processing_instruction: str,
    task_description: str
) -> Dict[str, Any]:
    """
    處理單個批次的數據
    
    這個函數模擬了對每個數據項目的處理邏輯
    在實際使用中，這裡會調用具體的處理邏輯
    """
    import time
    from datetime import datetime
    
    results = []
    success_count = 0
    error_count = 0
    
    # 模擬處理每個項目
    for i, item in enumerate(batch_data):
        try:
            # 這裡是實際的處理邏輯
            # 根據 processing_instruction 處理 item
            processed_result = await _process_single_item(item, processing_instruction)
            
            results.append({
                "item_index": i,
                "original_item": item,
                "processed_result": processed_result,
                "status": "success",
                "processing_time": time.time()
            })
            success_count += 1
            
        except Exception as e:
            results.append({
                "item_index": i,
                "original_item": item,
                "error": str(e),
                "status": "error",
                "processing_time": time.time()
            })
            error_count += 1
    
    # 生成批次摘要
    batch_summary = {
        "batch_number": batch_number,
        "items_count": len(batch_data),
        "success_count": success_count,
        "error_count": error_count,
        "success_rate": (success_count / len(batch_data)) * 100,
        "processing_instruction": processing_instruction,
        "task_description": task_description
    }
    
    return {
        "items": results,
        "summary": batch_summary,
        "success_count": success_count,
        "error_count": error_count,
        "timestamp": datetime.now().isoformat()
    }


async def _process_single_item(item: Any, instruction: str) -> Dict[str, Any]:
    """
    處理單個數據項目
    
    這個函數根據指令處理單個項目
    在實際使用中，這裡會包含具體的業務邏輯
    """
    # 模擬處理時間
    await asyncio.sleep(0.01)
    
    # 根據指令類型進行不同的處理
    if "分析" in instruction:
        return {
            "analysis_result": f"已分析項目: {item}",
            "key_insights": ["洞察1", "洞察2"],
            "confidence": 0.85
        }
    elif "分類" in instruction:
        return {
            "category": "類別A",
            "confidence": 0.92,
            "features": ["特徵1", "特徵2"]
        }
    elif "提取" in instruction:
        return {
            "extracted_data": {"key1": "value1", "key2": "value2"},
            "extraction_confidence": 0.88
        }
    else:
        return {
            "processed": True,
            "result": f"已處理: {item}",
            "method": "default_processing"
        }


@tool
async def get_batch_processing_status_tool(session_id: str, task_id: str) -> str:
    """
    獲取批次處理任務的詳細狀態
    
    Args:
        session_id: 會話ID
        task_id: 任務ID
        
    Returns:
        詳細狀態信息的JSON字符串
    """
    try:
        # 獲取累積結果
        accumulated_data = task_memory_manager.storage.load_temp_data(
            session_id, f"accumulated_results_{task_id}"
        )
        
        if accumulated_data:
            return json.dumps({
                "success": True,
                "status": accumulated_data,
                "message": f"任務進度: {accumulated_data.get('completion_percentage', 0):.1f}%"
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": "任務狀態不存在"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"❌ 獲取批次處理狀態失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


# 導出工具
def get_batch_processor_tools():
    """獲取批次處理工具"""
    return [
        smart_batch_processor_tool,
        get_batch_processing_status_tool
    ]
