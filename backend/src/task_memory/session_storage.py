"""
Session Storage

管理會話級別的存儲，包括暫存數據和文件摘要。
"""

import os
import json
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SessionStorage:
    """會話存儲管理器 - 支持重要資料表存儲和循環任務處理"""

    def __init__(self, base_dir: str = "task_memory"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)

        # 創建子目錄
        self.sessions_dir = self.base_dir / "sessions"
        self.global_cache_dir = self.base_dir / "global_cache"

        self.sessions_dir.mkdir(exist_ok=True)
        self.global_cache_dir.mkdir(exist_ok=True)
    
    def create_session(self, session_id: str) -> Dict[str, Any]:
        """
        創建新會話

        Args:
            session_id: 會話ID

        Returns:
            會話信息
        """
        try:
            session_dir = self.sessions_dir / session_id
            session_dir.mkdir(parents=True, exist_ok=True)

            # 創建子目錄
            (session_dir / "temp_data").mkdir(parents=True, exist_ok=True)
            (session_dir / "file_summaries").mkdir(parents=True, exist_ok=True)
            (session_dir / "task_states").mkdir(parents=True, exist_ok=True)
            (session_dir / "batch_processing").mkdir(parents=True, exist_ok=True)

            # 創建會話元數據
            session_info = {
                "session_id": session_id,
                "created_at": datetime.now().isoformat(),
                "last_accessed": datetime.now().isoformat(),
                "status": "active",
                "directories": {
                    "temp_data": str(session_dir / "temp_data"),
                    "file_summaries": str(session_dir / "file_summaries"),
                    "task_states": str(session_dir / "task_states"),
                    "batch_processing": str(session_dir / "batch_processing")
                }
            }

            # 保存會話信息
            with open(session_dir / "session_info.json", 'w', encoding='utf-8') as f:
                json.dump(session_info, f, ensure_ascii=False, indent=2)

            logger.info(f"創建會話成功: {session_id} -> {session_dir}")
            return session_info
            
        except Exception as e:
            logger.error(f"創建會話失敗 {session_id}: {e}")
            raise
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """獲取會話信息"""
        try:
            session_dir = self.sessions_dir / session_id
            info_file = session_dir / "session_info.json"
            
            if not info_file.exists():
                return None
            
            with open(info_file, 'r', encoding='utf-8') as f:
                session_info = json.load(f)
            
            # 更新最後訪問時間
            session_info["last_accessed"] = datetime.now().isoformat()
            with open(info_file, 'w', encoding='utf-8') as f:
                json.dump(session_info, f, ensure_ascii=False, indent=2)
            
            return session_info
            
        except Exception as e:
            logger.error(f"獲取會話信息失敗 {session_id}: {e}")
            return None
    
    def save_temp_data(self, session_id: str, data_id: str, data: Dict[str, Any]) -> bool:
        """
        保存暫存數據

        Args:
            session_id: 會話ID
            data_id: 數據ID
            data: 要保存的數據

        Returns:
            是否成功
        """
        try:
            session_dir = self.sessions_dir / session_id
            if not session_dir.exists():
                logger.info(f"會話目錄不存在，創建新會話: {session_id}")
                self.create_session(session_id)

            temp_dir = session_dir / "temp_data"
            # 確保 temp_data 目錄存在
            temp_dir.mkdir(exist_ok=True)

            data_file = temp_dir / f"{data_id}.json"

            # 添加元數據
            data_with_meta = {
                "data_id": data_id,
                "session_id": session_id,
                "created_at": datetime.now().isoformat(),
                "data": data
            }

            # 確保父目錄存在
            data_file.parent.mkdir(parents=True, exist_ok=True)

            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(data_with_meta, f, ensure_ascii=False, indent=2)

            logger.debug(f"保存暫存數據成功: {session_id}/{data_id} -> {data_file}")
            return True

        except Exception as e:
            logger.error(f"保存暫存數據失敗 {session_id}/{data_id}: {e}")
            logger.error(f"錯誤詳情: {type(e).__name__}: {str(e)}")
            return False
    
    def load_temp_data(self, session_id: str, data_id: str) -> Optional[Dict[str, Any]]:
        """加載暫存數據"""
        try:
            session_dir = self.sessions_dir / session_id
            temp_dir = session_dir / "temp_data"
            data_file = temp_dir / f"{data_id}.json"
            
            if not data_file.exists():
                return None
            
            with open(data_file, 'r', encoding='utf-8') as f:
                data_with_meta = json.load(f)
            
            return data_with_meta.get("data")
            
        except Exception as e:
            logger.error(f"加載暫存數據失敗 {session_id}/{data_id}: {e}")
            return None
    
    def list_temp_data(self, session_id: str) -> List[str]:
        """列出會話的所有暫存數據ID"""
        try:
            session_dir = self.sessions_dir / session_id
            temp_dir = session_dir / "temp_data"
            
            if not temp_dir.exists():
                return []
            
            data_ids = []
            for file_path in temp_dir.glob("*.json"):
                data_ids.append(file_path.stem)
            
            return data_ids
            
        except Exception as e:
            logger.error(f"列出暫存數據失敗 {session_id}: {e}")
            return []
    
    def save_file_summary(self, session_id: str, file_path: str, summary: Dict[str, Any]) -> bool:
        """保存文件摘要"""
        try:
            session_dir = self.sessions_dir / session_id
            if not session_dir.exists():
                self.create_session(session_id)
            
            summaries_dir = session_dir / "file_summaries"
            
            # 使用文件路徑的哈希作為文件名
            import hashlib
            file_hash = hashlib.md5(file_path.encode()).hexdigest()
            summary_file = summaries_dir / f"{file_hash}.json"
            
            summary_with_meta = {
                "file_path": file_path,
                "session_id": session_id,
                "saved_at": datetime.now().isoformat(),
                "summary": summary
            }
            
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary_with_meta, f, ensure_ascii=False, indent=2)
            
            logger.debug(f"保存文件摘要: {session_id}/{file_path}")
            return True
            
        except Exception as e:
            logger.error(f"保存文件摘要失敗 {session_id}/{file_path}: {e}")
            return False
    
    def load_file_summary(self, session_id: str, file_path: str) -> Optional[Dict[str, Any]]:
        """加載文件摘要"""
        try:
            session_dir = self.sessions_dir / session_id
            summaries_dir = session_dir / "file_summaries"
            
            import hashlib
            file_hash = hashlib.md5(file_path.encode()).hexdigest()
            summary_file = summaries_dir / f"{file_hash}.json"
            
            if not summary_file.exists():
                return None
            
            with open(summary_file, 'r', encoding='utf-8') as f:
                summary_with_meta = json.load(f)
            
            return summary_with_meta.get("summary")
            
        except Exception as e:
            logger.error(f"加載文件摘要失敗 {session_id}/{file_path}: {e}")
            return None
    
    def cleanup_session(self, session_id: str) -> bool:
        """清理會話數據"""
        try:
            session_dir = self.sessions_dir / session_id
            if session_dir.exists():
                shutil.rmtree(session_dir)
                logger.info(f"清理會話: {session_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"清理會話失敗 {session_id}: {e}")
            return False
    
    def list_sessions(self) -> List[Dict[str, Any]]:
        """列出所有會話"""
        try:
            sessions = []
            for session_dir in self.sessions_dir.iterdir():
                if session_dir.is_dir():
                    session_info = self.get_session_info(session_dir.name)
                    if session_info:
                        sessions.append(session_info)
            
            return sessions
            
        except Exception as e:
            logger.error(f"列出會話失敗: {e}")
            return []
    
    def cleanup_old_sessions(self, days: int = 7) -> int:
        """清理舊會話"""
        try:
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=days)
            
            cleaned_count = 0
            for session_dir in self.sessions_dir.iterdir():
                if session_dir.is_dir():
                    session_info = self.get_session_info(session_dir.name)
                    if session_info:
                        last_accessed = datetime.fromisoformat(session_info["last_accessed"])
                        if last_accessed < cutoff_date:
                            self.cleanup_session(session_dir.name)
                            cleaned_count += 1
            
            logger.info(f"清理了 {cleaned_count} 個舊會話")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"清理舊會話失敗: {e}")
            return 0

    # ==================== 重要資料表存儲功能 ====================

    def save_processed_data_table(self, session_id: str, table_id: str, data: Dict[str, Any],
                                 table_type: str = "unknown") -> bool:
        """
        保存處理好的重要資料表

        Args:
            session_id: 會話ID
            table_id: 資料表ID
            data: 處理好的數據
            table_type: 資料表類型 (data/text/analysis)

        Returns:
            是否保存成功
        """
        try:
            session_data_dir = self.data_tables_dir / session_id
            session_data_dir.mkdir(exist_ok=True)

            table_info = {
                "table_id": table_id,
                "table_type": table_type,
                "data": data,
                "created_at": datetime.now().isoformat(),
                "session_id": session_id,
                "metadata": {
                    "data_size": len(str(data)),
                    "data_keys": list(data.keys()) if isinstance(data, dict) else [],
                    "data_type": type(data).__name__
                }
            }

            table_file = session_data_dir / f"{table_id}.json"
            with open(table_file, 'w', encoding='utf-8') as f:
                json.dump(table_info, f, ensure_ascii=False, indent=2)

            logger.info(f"重要資料表已保存: {session_id}/{table_id}")
            return True

        except Exception as e:
            logger.error(f"保存重要資料表失敗 {session_id}/{table_id}: {e}")
            return False

    def get_processed_data_table(self, session_id: str, table_id: str) -> Optional[Dict[str, Any]]:
        """
        獲取處理好的重要資料表

        Args:
            session_id: 會話ID
            table_id: 資料表ID

        Returns:
            資料表信息，如果不存在則返回 None
        """
        try:
            table_file = self.data_tables_dir / session_id / f"{table_id}.json"

            if not table_file.exists():
                return None

            with open(table_file, 'r', encoding='utf-8') as f:
                table_info = json.load(f)

            return table_info

        except Exception as e:
            logger.error(f"獲取重要資料表失敗 {session_id}/{table_id}: {e}")
            return None

    def list_processed_data_tables(self, session_id: str) -> List[Dict[str, Any]]:
        """
        列出會話的所有重要資料表

        Args:
            session_id: 會話ID

        Returns:
            資料表列表
        """
        try:
            session_data_dir = self.data_tables_dir / session_id

            if not session_data_dir.exists():
                return []

            tables = []
            for table_file in session_data_dir.glob("*.json"):
                try:
                    with open(table_file, 'r', encoding='utf-8') as f:
                        table_info = json.load(f)

                    # 只返回元信息，不包含完整數據
                    table_summary = {
                        "table_id": table_info["table_id"],
                        "table_type": table_info["table_type"],
                        "created_at": table_info["created_at"],
                        "metadata": table_info["metadata"]
                    }
                    tables.append(table_summary)

                except Exception as e:
                    logger.warning(f"讀取資料表文件失敗 {table_file}: {e}")
                    continue

            return tables

        except Exception as e:
            logger.error(f"列出重要資料表失敗 {session_id}: {e}")
            return []

    # ==================== 循環任務批次處理功能 ====================

    def start_batch_processing(self, session_id: str, task_id: str, total_items: int,
                              batch_size: int = 10) -> bool:
        """
        開始批次處理任務

        Args:
            session_id: 會話ID
            task_id: 任務ID
            total_items: 總項目數
            batch_size: 每批處理數量

        Returns:
            是否創建成功
        """
        try:
            session_dir = self.sessions_dir / session_id
            if not session_dir.exists():
                self.create_session(session_id)

            session_batch_dir = session_dir / "batch_processing"
            session_batch_dir.mkdir(exist_ok=True)

            batch_info = {
                "task_id": task_id,
                "session_id": session_id,
                "total_items": total_items,
                "batch_size": batch_size,
                "processed_items": 0,
                "current_batch": 0,
                "total_batches": (total_items + batch_size - 1) // batch_size,
                "status": "started",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "batches": {},  # 存儲每批的處理結果
                "final_result": None
            }

            batch_file = session_batch_dir / f"{task_id}.json"
            with open(batch_file, 'w', encoding='utf-8') as f:
                json.dump(batch_info, f, ensure_ascii=False, indent=2)

            logger.info(f"批次處理任務已創建: {session_id}/{task_id}")
            return True

        except Exception as e:
            logger.error(f"創建批次處理任務失敗 {session_id}/{task_id}: {e}")
            return False

    def save_batch_result(self, session_id: str, task_id: str, batch_number: int,
                         batch_data: Dict[str, Any]) -> bool:
        """
        保存批次處理結果

        Args:
            session_id: 會話ID
            task_id: 任務ID
            batch_number: 批次號
            batch_data: 批次處理結果

        Returns:
            是否保存成功
        """
        try:
            session_dir = self.sessions_dir / session_id
            batch_file = session_dir / "batch_processing" / f"{task_id}.json"

            if not batch_file.exists():
                logger.error(f"批次處理任務不存在: {session_id}/{task_id}")
                return False

            with open(batch_file, 'r', encoding='utf-8') as f:
                batch_info = json.load(f)

            # 更新批次結果
            batch_info["batches"][str(batch_number)] = {
                "batch_number": batch_number,
                "data": batch_data,
                "processed_at": datetime.now().isoformat(),
                "item_count": len(batch_data) if isinstance(batch_data, (list, dict)) else 1
            }

            # 更新進度
            batch_info["current_batch"] = max(batch_info["current_batch"], batch_number)
            batch_info["processed_items"] += batch_info["batches"][str(batch_number)]["item_count"]
            batch_info["updated_at"] = datetime.now().isoformat()

            # 檢查是否完成
            if batch_info["current_batch"] >= batch_info["total_batches"] - 1:
                batch_info["status"] = "completed"

            with open(batch_file, 'w', encoding='utf-8') as f:
                json.dump(batch_info, f, ensure_ascii=False, indent=2)

            logger.info(f"批次結果已保存: {session_id}/{task_id}/batch_{batch_number}")
            return True

        except Exception as e:
            logger.error(f"保存批次結果失敗 {session_id}/{task_id}: {e}")
            return False

    def get_batch_processing_status(self, session_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """
        獲取批次處理狀態

        Args:
            session_id: 會話ID
            task_id: 任務ID

        Returns:
            批次處理狀態信息
        """
        try:
            session_dir = self.sessions_dir / session_id
            batch_file = session_dir / "batch_processing" / f"{task_id}.json"

            if not batch_file.exists():
                return None

            with open(batch_file, 'r', encoding='utf-8') as f:
                batch_info = json.load(f)

            # 計算進度
            progress_percentage = (batch_info["processed_items"] / batch_info["total_items"]) * 100

            status = {
                "task_id": batch_info["task_id"],
                "status": batch_info["status"],
                "progress": {
                    "processed_items": batch_info["processed_items"],
                    "total_items": batch_info["total_items"],
                    "percentage": round(progress_percentage, 2),
                    "current_batch": batch_info["current_batch"],
                    "total_batches": batch_info["total_batches"]
                },
                "created_at": batch_info["created_at"],
                "updated_at": batch_info["updated_at"],
                "completed_batches": len(batch_info["batches"])
            }

            return status

        except Exception as e:
            logger.error(f"獲取批次處理狀態失敗 {session_id}/{task_id}: {e}")
            return None

    def get_complete_batch_result(self, session_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """
        獲取完整的批次處理結果（僅當任務完成時）

        Args:
            session_id: 會話ID
            task_id: 任務ID

        Returns:
            完整的處理結果
        """
        try:
            session_dir = self.sessions_dir / session_id
            batch_file = session_dir / "batch_processing" / f"{task_id}.json"

            if not batch_file.exists():
                return None

            with open(batch_file, 'r', encoding='utf-8') as f:
                batch_info = json.load(f)

            if batch_info["status"] != "completed":
                return {
                    "success": False,
                    "error": f"任務尚未完成，當前狀態: {batch_info['status']}"
                }

            # 合併所有批次結果
            all_results = []
            for batch_num in sorted(batch_info["batches"].keys(), key=int):
                batch_data = batch_info["batches"][batch_num]["data"]
                if isinstance(batch_data, list):
                    all_results.extend(batch_data)
                else:
                    all_results.append(batch_data)

            return {
                "success": True,
                "task_id": task_id,
                "total_items": batch_info["total_items"],
                "total_batches": batch_info["total_batches"],
                "results": all_results,
                "completed_at": batch_info["updated_at"]
            }

        except Exception as e:
            logger.error(f"獲取完整批次結果失敗 {session_id}/{task_id}: {e}")
            return None


# 全局存儲實例
session_storage = SessionStorage()
