"""
Gmail 批量抓取工具
實現異步批量抓取 Gmail 郵件數據
"""

import asyncio
import aiohttp
import json
import pandas as pd
import tempfile
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class GmailBatchFetcher:
    """Gmail 批量抓取器"""
    
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        """異步上下文管理器入口"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """異步上下文管理器出口"""
        if self.session:
            await self.session.close()
    
    async def fetch_gmail_batch(
        self, 
        access_token: str, 
        email_address: str,
        total_emails: int = 1000,
        batch_size: int = 50,
        concurrent_batches: int = 20,
        session_id: str = "default"
    ) -> Dict[str, Any]:
        """
        批量抓取 Gmail 郵件
        
        Args:
            access_token: OAuth access token
            email_address: 用戶 email 地址
            total_emails: 總共要抓取的郵件數量
            batch_size: 每批抓取的郵件數量
            concurrent_batches: 並發批次數量
            session_id: 會話 ID
            
        Returns:
            包含抓取結果和 CSV 文件路徑的字典
        """
        try:
            logger.info(f"🚀 開始批量抓取 Gmail 郵件: {email_address}")
            logger.info(f"📊 參數: total={total_emails}, batch_size={batch_size}, concurrent={concurrent_batches}")
            
            # 步驟1: 獲取郵件 ID 列表
            message_ids = await self._get_message_ids(access_token, total_emails)
            if not message_ids:
                return {
                    "success": False,
                    "error": "無法獲取郵件 ID 列表"
                }
            
            actual_total = min(len(message_ids), total_emails)
            logger.info(f"📧 獲取到 {len(message_ids)} 個郵件 ID，將抓取 {actual_total} 封")
            
            # 步驟2: 分批處理
            batches = []
            for i in range(0, actual_total, batch_size):
                batch_ids = message_ids[i:i + batch_size]
                batches.append(batch_ids)
            
            logger.info(f"📦 分成 {len(batches)} 批，每批最多 {batch_size} 封")
            
            # 步驟3: 異步並發抓取
            semaphore = asyncio.Semaphore(concurrent_batches)
            tasks = []
            
            for batch_index, batch_ids in enumerate(batches):
                task = self._fetch_batch_with_semaphore(
                    semaphore, access_token, batch_ids, batch_index
                )
                tasks.append(task)
            
            # 等待所有批次完成
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 步驟4: 整合結果
            all_emails = []
            successful_batches = 0
            failed_batches = 0
            
            for i, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    logger.error(f"❌ 批次 {i} 失敗: {result}")
                    failed_batches += 1
                elif result and result.get("success"):
                    all_emails.extend(result.get("emails", []))
                    successful_batches += 1
                else:
                    logger.warning(f"⚠️ 批次 {i} 返回空結果")
                    failed_batches += 1
            
            logger.info(f"✅ 批量抓取完成: 成功 {successful_batches} 批，失敗 {failed_batches} 批")
            logger.info(f"📧 總共獲取 {len(all_emails)} 封郵件")
            
            # 步驟5: 保存為 CSV
            csv_path = await self._save_emails_to_csv(all_emails, email_address, session_id)
            
            # 步驟6: 生成文件摘要
            file_summary = await self._generate_file_summary(all_emails, csv_path)
            
            return {
                "success": True,
                "total_emails": len(all_emails),
                "csv_path": csv_path,
                "file_summary": file_summary,
                "email_address": email_address,
                "successful_batches": successful_batches,
                "failed_batches": failed_batches
            }
            
        except Exception as e:
            logger.error(f"❌ Gmail 批量抓取失敗: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _get_message_ids(self, access_token: str, max_results: int) -> List[str]:
        """獲取郵件 ID 列表"""
        try:
            url = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            params = {
                "maxResults": min(max_results, 500),  # Gmail API 單次最多 500
                "q": "category:primary"  # 只獲取主要區域
            }
            
            message_ids = []
            next_page_token = None
            
            while len(message_ids) < max_results:
                if next_page_token:
                    params["pageToken"] = next_page_token
                
                async with self.session.get(url, headers=headers, params=params) as response:
                    if response.status != 200:
                        logger.error(f"❌ 獲取郵件列表失敗: {response.status}")
                        break
                    
                    data = await response.json()
                    messages = data.get("messages", [])
                    
                    for msg in messages:
                        if len(message_ids) >= max_results:
                            break
                        message_ids.append(msg["id"])
                    
                    next_page_token = data.get("nextPageToken")
                    if not next_page_token:
                        break
            
            return message_ids
            
        except Exception as e:
            logger.error(f"❌ 獲取郵件 ID 列表失敗: {e}")
            return []
    
    async def _fetch_batch_with_semaphore(
        self, 
        semaphore: asyncio.Semaphore, 
        access_token: str, 
        batch_ids: List[str], 
        batch_index: int
    ) -> Dict[str, Any]:
        """使用信號量控制並發的批次抓取"""
        async with semaphore:
            return await self._fetch_email_batch(access_token, batch_ids, batch_index)
    
    async def _fetch_email_batch(
        self, 
        access_token: str, 
        batch_ids: List[str], 
        batch_index: int
    ) -> Dict[str, Any]:
        """抓取一批郵件的詳細信息"""
        try:
            logger.info(f"📦 開始處理批次 {batch_index}: {len(batch_ids)} 封郵件")
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            emails = []
            
            # 並發獲取每封郵件的詳細信息
            tasks = []
            for msg_id in batch_ids:
                task = self._fetch_single_email(headers, msg_id)
                tasks.append(task)
            
            email_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in email_results:
                if isinstance(result, Exception):
                    logger.warning(f"⚠️ 獲取單封郵件失敗: {result}")
                elif result:
                    emails.append(result)
            
            logger.info(f"✅ 批次 {batch_index} 完成: 成功獲取 {len(emails)} 封郵件")
            
            return {
                "success": True,
                "emails": emails,
                "batch_index": batch_index
            }
            
        except Exception as e:
            logger.error(f"❌ 批次 {batch_index} 處理失敗: {e}")
            return {
                "success": False,
                "error": str(e),
                "batch_index": batch_index
            }
    
    async def _fetch_single_email(self, headers: Dict[str, str], msg_id: str) -> Optional[Dict[str, Any]]:
        """獲取單封郵件的詳細信息"""
        try:
            url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}"
            params = {
                "format": "metadata",
                "metadataHeaders": ["Subject", "From", "Date", "To"]
            }
            
            async with self.session.get(url, headers=headers, params=params) as response:
                if response.status != 200:
                    return None
                
                data = await response.json()
                headers_list = data.get("payload", {}).get("headers", [])
                
                # 提取郵件信息
                subject = ""
                sender = ""
                date = ""
                recipient = ""
                
                for header in headers_list:
                    name = header.get("name", "").lower()
                    value = header.get("value", "")
                    
                    if name == "subject":
                        subject = value
                    elif name == "from":
                        sender = value
                    elif name == "date":
                        date = value
                    elif name == "to":
                        recipient = value
                
                return {
                    "id": data.get("id"),
                    "thread_id": data.get("threadId"),
                    "subject": subject[:200] if subject else "無主旨",
                    "sender": sender,
                    "recipient": recipient,
                    "date": date,
                    "snippet": data.get("snippet", ""),
                    "is_read": "UNREAD" not in data.get("labelIds", []),
                    "labels": ",".join(data.get("labelIds", [])),
                    "url": f"https://mail.google.com/mail/u/0/#all/{data.get('id')}"
                }
                
        except Exception as e:
            logger.warning(f"⚠️ 獲取郵件 {msg_id} 失敗: {e}")
            return None
    
    async def _save_emails_to_csv(
        self, 
        emails: List[Dict[str, Any]], 
        email_address: str, 
        session_id: str
    ) -> str:
        """將郵件數據保存為 CSV 文件"""
        try:
            # 創建會話級暫存目錄
            temp_dir = Path(tempfile.gettempdir()) / "agent_sessions" / session_id
            temp_dir.mkdir(parents=True, exist_ok=True)
            
            # 生成 CSV 文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            csv_filename = f"gmail_emails_{email_address.replace('@', '_')}_{timestamp}.csv"
            csv_path = temp_dir / csv_filename
            
            # 轉換為 DataFrame
            df = pd.DataFrame(emails)
            
            # 保存為 CSV
            df.to_csv(csv_path, index=False, encoding='utf-8-sig')
            
            logger.info(f"💾 Gmail 數據已保存到: {csv_path}")
            logger.info(f"📊 CSV 文件包含 {len(emails)} 行數據")
            
            return str(csv_path)
            
        except Exception as e:
            logger.error(f"❌ 保存 CSV 文件失敗: {e}")
            raise
    
    async def _generate_file_summary(
        self, 
        emails: List[Dict[str, Any]], 
        csv_path: str
    ) -> Dict[str, Any]:
        """生成文件摘要"""
        try:
            if not emails:
                return {
                    "file_type": "gmail_csv",
                    "total_emails": 0,
                    "summary": "空的 Gmail 數據文件"
                }
            
            # 統計信息
            total_emails = len(emails)
            unread_count = sum(1 for email in emails if not email.get("is_read", True))
            
            # 統計發件人
            senders = {}
            for email in emails:
                sender = email.get("sender", "未知發件人")
                senders[sender] = senders.get(sender, 0) + 1
            
            top_senders = sorted(senders.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # 時間範圍
            dates = [email.get("date", "") for email in emails if email.get("date")]
            date_range = f"最新 {total_emails} 封郵件" if dates else "無日期信息"
            
            summary = {
                "file_type": "gmail_csv",
                "file_path": csv_path,
                "total_emails": total_emails,
                "unread_emails": unread_count,
                "read_emails": total_emails - unread_count,
                "top_senders": top_senders,
                "date_range": date_range,
                "columns": ["id", "thread_id", "subject", "sender", "recipient", "date", "snippet", "is_read", "labels", "url"],
                "summary": f"Gmail 郵件數據，共 {total_emails} 封郵件，其中 {unread_count} 封未讀"
            }
            
            logger.info(f"📋 文件摘要已生成: {summary['summary']}")
            return summary
            
        except Exception as e:
            logger.error(f"❌ 生成文件摘要失敗: {e}")
            return {
                "file_type": "gmail_csv",
                "total_emails": len(emails),
                "summary": f"Gmail 數據文件，包含 {len(emails)} 封郵件",
                "error": str(e)
            }


# 全局實例
gmail_fetcher = GmailBatchFetcher()


async def fetch_gmail_emails_batch(
    access_token: str,
    email_address: str,
    total_emails: int = 1000,
    session_id: str = "default"
) -> Dict[str, Any]:
    """
    批量抓取 Gmail 郵件的便利函數
    
    Args:
        access_token: OAuth access token
        email_address: 用戶 email 地址
        total_emails: 要抓取的郵件總數
        session_id: 會話 ID
        
    Returns:
        抓取結果字典
    """
    async with GmailBatchFetcher() as fetcher:
        return await fetcher.fetch_gmail_batch(
            access_token=access_token,
            email_address=email_address,
            total_emails=total_emails,
            batch_size=50,
            concurrent_batches=20,
            session_id=session_id
        )
