"""
指紋搜尋工具 - 基於 Google 指紋搜尋概念的文字搜尋工具
支援語義搜尋和關鍵字匹配的混合檢索
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import logging
from datetime import datetime
import re
import math
import time
import asyncio
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# Azure OpenAI Embedding 配置
from openai import AzureOpenAI
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# 從環境變數獲取配置
EMBED_KEY = os.getenv("EMBED_KEY")
EMBED_END = os.getenv("EMBED_END")

# 創建 Azure OpenAI embedding client
embed_client = None
if EMBED_KEY and EMBED_END:
    try:
        embed_client = AzureOpenAI(
            api_key=EMBED_KEY,
            api_version="2024-08-01-preview",
            azure_endpoint=EMBED_END,
        )
        logging.info("✅ Azure OpenAI embedding client 初始化成功")
    except Exception as e:
        logging.error(f"❌ Azure OpenAI embedding client 初始化失敗: {e}")
        embed_client = None
else:
    logging.warning("⚠️ 缺少 EMBED_KEY 或 EMBED_END 環境變數")

def embedder(query: str) -> List[float]:
    """呼叫 Azure OpenAI embedder 將 query 轉向量"""
    if not embed_client:
        logging.warning("Embedding client 不可用，返回空向量")
        return []

    try:
        response = embed_client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        return response.data[0].embedding
    except Exception as e:
        logging.error(f"Embedding 請求失敗: {e}")
        return []

from supervisor_agent.core.session_data_manager import session_data_manager

logger = logging.getLogger(__name__)


class AdvancedFingerprintSearchEngine:
    """進階指紋搜尋引擎 - 基於 Google 指紋搜尋概念"""

    def __init__(self):
        self.embedder = embedder
        self.llm_client = embed_client  # 重用 Azure OpenAI client 做關鍵字擴展

        # BM25 參數
        self.k1 = 1.2  # term frequency saturation parameter
        self.b = 0.75  # length normalization parameter

        # 評分權重 (移除 sender 和 recency)
        self.weights = {
            'bm25_subject': 2.5,
            'bm25_body': 1.2,
            'semantic': 1.5,
            'entity': 1.0
        }

    def batch_embeddings(self, texts: List[str], batch_size: int = 35) -> List[List[float]]:
        """批次處理 embeddings，提升速度"""
        if not texts:
            return []

        all_embeddings = []

        try:
            # 分批處理
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]

                # 調用 Azure OpenAI batch embedding
                response = embed_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=batch_texts
                )

                # 提取 embeddings
                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)

                logger.info(f"🔄 處理 embedding 批次 {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")

        except Exception as e:
            logger.error(f"❌ 批次 embedding 失敗: {e}")
            # 回退到逐一處理
            for text in texts:
                try:
                    embedding = embedder(text)
                    all_embeddings.append(embedding)
                except:
                    all_embeddings.append([0.0] * 1536)  # 預設維度

        return all_embeddings

    async def expand_query_keywords(self, query: str) -> List[str]:
        """使用預定義規則擴展查詢關鍵字（暫時替代 LLM）"""

        # 預定義的關鍵字擴展規則
        expansion_rules = {
            '財務': ['財務', 'finance', '會計', 'accounting', '發票', 'invoice', '付款', 'payment', '收費', 'billing', '預算', 'budget', '成本', 'cost', '報銷', 'reimbursement', '稅務', 'tax', '帳單', 'bill'],
            '專案': ['專案', 'project', '進度', 'progress', '開發', 'development', '管理', 'management', '會議', 'meeting', '討論', 'discussion', '計畫', 'plan', '執行', 'execution'],
            '客戶': ['客戶', 'customer', '客服', 'service', '投訴', 'complaint', '問題', 'issue', '支援', 'support', '諮詢', 'inquiry', '回覆', 'reply', '處理', 'handle'],
            '員工': ['員工', 'employee', '人事', 'HR', '申訴', 'grievance', '薪資', 'salary', '福利', 'benefit', '工作', 'work', '環境', 'environment', '管理', 'management'],
            '產品': ['產品', 'product', '服務', 'service', '品質', 'quality', '功能', 'feature', '規格', 'specification', '價格', 'price', '銷售', 'sales']
        }

        # 基於查詢內容匹配擴展規則
        expanded_keywords = [query]

        for key, keywords in expansion_rules.items():
            if key in query:
                expanded_keywords.extend(keywords)
                break

        # 移除重複
        expanded_keywords = list(dict.fromkeys(expanded_keywords))

        logger.info(f"🔍 查詢擴展: {query} -> {len(expanded_keywords)} 個關鍵字")
        return expanded_keywords

    def calculate_bm25_score(self, query_terms: List[str], doc_terms: List[str],
                           doc_length: int, avg_doc_length: float,
                           corpus_size: int, term_doc_freq: Dict[str, int]) -> float:
        """計算 BM25 分數"""
        score = 0.0

        for term in query_terms:
            if term in doc_terms:
                # Term frequency in document
                tf = doc_terms.count(term)

                # Document frequency (how many docs contain this term)
                df = term_doc_freq.get(term, 1)

                # Inverse document frequency
                idf = math.log((corpus_size - df + 0.5) / (df + 0.5))

                # BM25 formula
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * (doc_length / avg_doc_length))

                score += idf * (numerator / denominator)

        return score

    def calculate_recency_score(self, date_str: str) -> float:
        """計算時間新近度分數"""
        try:
            if pd.isna(date_str) or not date_str:
                return 0.0

            # 解析日期
            doc_date = pd.to_datetime(date_str)
            now = pd.Timestamp.now()

            # 計算天數差異
            days_diff = (now - doc_date).days

            # 時間衰減函數：越新的郵件分數越高
            if days_diff <= 7:
                return 1.0  # 一週內
            elif days_diff <= 30:
                return 0.8  # 一個月內
            elif days_diff <= 90:
                return 0.6  # 三個月內
            elif days_diff <= 365:
                return 0.4  # 一年內
            else:
                return 0.2  # 超過一年

        except Exception:
            return 0.0

    def check_sender_whitelist(self, sender: str) -> float:
        """檢查發件人白名單（可擴展）"""
        if pd.isna(sender) or not sender:
            return 0.0

        sender = sender.lower()

        # 內部郵件加分
        if 'lenstech.ai' in sender:
            return 1.0

        # 重要客戶或合作夥伴（可配置）
        important_domains = ['gmail.com', 'outlook.com']
        for domain in important_domains:
            if domain in sender:
                return 0.5

        return 0.0

    def create_text_fingerprint(self, text: str) -> Dict[str, Any]:
        """為文字創建指紋"""
        if not text or pd.isna(text):
            return {
                "semantic_vector": None,
                "lexical_tokens": [],
                "entities": {},
                "text_length": 0
            }
        
        text = str(text).strip()
        
        # 語義指紋 - 使用 embedding
        semantic_vector = None
        if self.embedder:
            try:
                semantic_vector = self.embedder(text)
            except Exception as e:
                logger.warning(f"Embedding 失敗: {e}")
        
        # 詞彙指紋 - 簡單的分詞
        lexical_tokens = self._tokenize(text)
        
        # 實體指紋 - 提取金額、日期等
        entities = self._extract_entities(text)
        
        return {
            "semantic_vector": semantic_vector,
            "lexical_tokens": lexical_tokens,
            "entities": entities,
            "text_length": len(text)
        }
    
    def _tokenize(self, text: str) -> List[str]:
        """簡單分詞"""
        # 移除標點符號，保留中英文和數字
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = text.lower().split()
        return [token for token in tokens if len(token) > 1]
    
    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """提取實體（金額、日期等）"""
        entities = {}
        
        # 金額匹配
        amount_pattern = r'(?:NT\$|\$|USD|TWD|元)\s*[\d,]+(?:\.\d{1,2})?|\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:元|USD|TWD)'
        amounts = re.findall(amount_pattern, text, re.IGNORECASE)
        if amounts:
            entities['amounts'] = amounts
        
        # 日期匹配
        date_pattern = r'\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}'
        dates = re.findall(date_pattern, text)
        if dates:
            entities['dates'] = dates
        
        # 電子郵件
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            entities['emails'] = emails
        
        return entities
    
    async def calculate_advanced_similarity(self, query: str, expanded_keywords: List[str],
                                          doc_data: Dict[str, Any], corpus_stats: Dict[str, Any]) -> Dict[str, float]:
        """
        計算進階相似度分數 (標準化版本)
        基於公式: 2.5×BM25_subject + 1.2×BM25_body + 1.5×cos(q,d) + 1.0×EntityMatch
        所有分數都標準化到 0-1 範圍後再加權
        """
        scores = {}

        # 準備查詢詞彙
        query_terms = self._tokenize(' '.join(expanded_keywords))

        # 1. BM25 for Subject
        subject = doc_data.get('subject', '')
        if subject:
            subject_terms = self._tokenize(subject)
            bm25_subject_raw = self.calculate_bm25_score(
                query_terms, subject_terms, len(subject_terms),
                corpus_stats['avg_subject_length'], corpus_stats['corpus_size'],
                corpus_stats['subject_term_freq']
            )
            # 標準化 BM25 分數 (使用 sigmoid 函數)
            scores['bm25_subject'] = self._normalize_bm25(bm25_subject_raw)
        else:
            scores['bm25_subject'] = 0.0

        # 2. BM25 for Body/Content
        content = doc_data.get('snippet', '') + ' ' + doc_data.get('content', '')
        if content.strip():
            content_terms = self._tokenize(content)
            bm25_body_raw = self.calculate_bm25_score(
                query_terms, content_terms, len(content_terms),
                corpus_stats['avg_content_length'], corpus_stats['corpus_size'],
                corpus_stats['content_term_freq']
            )
            # 標準化 BM25 分數
            scores['bm25_body'] = self._normalize_bm25(bm25_body_raw)
        else:
            scores['bm25_body'] = 0.0

        # 3. Semantic Similarity (已經是 0-1 範圍)
        full_text = f"{subject} {content}".strip()
        if full_text and self.embedder:
            try:
                doc_vector = self.embedder(full_text)
                query_vector = self.embedder(query)

                if doc_vector and query_vector:
                    doc_vec = np.array(doc_vector).reshape(1, -1)
                    query_vec = np.array(query_vector).reshape(1, -1)
                    scores['semantic'] = cosine_similarity(query_vec, doc_vec)[0][0]
                else:
                    scores['semantic'] = 0.0
            except Exception as e:
                logger.warning(f"語義相似度計算失敗: {e}")
                scores['semantic'] = 0.0
        else:
            scores['semantic'] = 0.0

        # 4. Entity Match (已經是 0-1 範圍)
        query_entities = self._extract_entities(query)
        doc_entities = self._extract_entities(full_text)
        scores['entity'] = self._calculate_entity_match(query_entities, doc_entities)

        # 計算加權總分
        total_score = (
            self.weights['bm25_subject'] * scores['bm25_subject'] +
            self.weights['bm25_body'] * scores['bm25_body'] +
            self.weights['semantic'] * scores['semantic'] +
            self.weights['entity'] * scores['entity']
        )

        # 返回詳細分數和總分
        scores['total'] = total_score
        return scores

    def calculate_advanced_similarity_fast(self, query: str, expanded_keywords: List[str],
                                         doc_data: Dict[str, Any], corpus_stats: Dict[str, Any],
                                         query_embedding: List[float], doc_embedding: List[float]) -> Dict[str, float]:
        """
        快速計算進階相似度分數（使用預計算的 embeddings）
        """
        scores = {}

        # 準備查詢詞彙
        query_terms = self._tokenize(' '.join(expanded_keywords))

        # 1. BM25 for Subject
        subject = doc_data.get('subject', '')
        if subject:
            subject_terms = self._tokenize(subject)
            bm25_subject_raw = self.calculate_bm25_score(
                query_terms, subject_terms, len(subject_terms),
                corpus_stats['avg_subject_length'], corpus_stats['corpus_size'],
                corpus_stats['subject_term_freq']
            )
            scores['bm25_subject'] = self._normalize_bm25(bm25_subject_raw)
        else:
            scores['bm25_subject'] = 0.0

        # 2. BM25 for Body/Content
        content = doc_data.get('snippet', '') + ' ' + doc_data.get('content', '')
        if content.strip():
            content_terms = self._tokenize(content)
            bm25_body_raw = self.calculate_bm25_score(
                query_terms, content_terms, len(content_terms),
                corpus_stats['avg_content_length'], corpus_stats['corpus_size'],
                corpus_stats['content_term_freq']
            )
            scores['bm25_body'] = self._normalize_bm25(bm25_body_raw)
        else:
            scores['bm25_body'] = 0.0

        # 3. Semantic Similarity（使用預計算的 embeddings）
        if query_embedding and doc_embedding:
            try:
                query_vec = np.array(query_embedding).reshape(1, -1)
                doc_vec = np.array(doc_embedding).reshape(1, -1)
                scores['semantic'] = cosine_similarity(query_vec, doc_vec)[0][0]
            except Exception as e:
                logger.warning(f"語義相似度計算失敗: {e}")
                scores['semantic'] = 0.0
        else:
            scores['semantic'] = 0.0

        # 4. Entity Match
        full_text = f"{subject} {content}".strip()
        query_entities = self._extract_entities(query)
        doc_entities = self._extract_entities(full_text)
        scores['entity'] = self._calculate_entity_match(query_entities, doc_entities)

        # 計算加權總分
        total_score = (
            self.weights['bm25_subject'] * scores['bm25_subject'] +
            self.weights['bm25_body'] * scores['bm25_body'] +
            self.weights['semantic'] * scores['semantic'] +
            self.weights['entity'] * scores['entity']
        )

        scores['total'] = total_score
        return scores

    def _normalize_bm25(self, bm25_score: float, max_expected: float = 8.0) -> float:
        """
        線性標準化 BM25 分數到 0-1 範圍
        保持更好的區分度和影響力
        """
        if bm25_score <= 0:
            return 0.0

        # 線性標準化：BM25 分數除以期望最大值
        normalized = min(1.0, bm25_score / max_expected)
        return normalized

    def _calculate_entity_match(self, query_entities: Dict[str, List[str]],
                               doc_entities: Dict[str, List[str]]) -> float:
        """
        計算實體匹配分數 (回到簡單正確的邏輯)
        只有當查詢和文檔都有實體時才進行匹配
        """
        # 如果查詢中沒有實體，返回 0（不加分也不扣分）
        if not query_entities:
            return 0.0

        # 如果文檔中沒有實體，返回 0
        if not doc_entities:
            return 0.0

        # 計算實體類型匹配度
        total_matches = 0
        total_query_entities = 0

        for entity_type in query_entities:
            query_set = set(query_entities[entity_type])
            doc_set = set(doc_entities.get(entity_type, []))

            # 精確匹配
            exact_matches = len(query_set & doc_set)

            # 如果是金額，也檢查數值相似性
            if entity_type == 'amounts' and exact_matches == 0:
                similarity_score = self._calculate_amount_similarity(
                    query_entities[entity_type],
                    doc_entities.get(entity_type, [])
                )
                # 如果相似度高，算作部分匹配
                if similarity_score > 0.7:
                    exact_matches = similarity_score

            total_matches += exact_matches
            total_query_entities += len(query_set)

        # 返回匹配比例
        return total_matches / total_query_entities if total_query_entities > 0 else 0.0

    def _calculate_amount_similarity(self, query_amounts: List[str], doc_amounts: List[str]) -> float:
        """計算金額相似性"""
        try:
            # 提取數值
            query_values = []
            for amount in query_amounts:
                value = re.findall(r'[\d,]+(?:\.\d+)?', amount.replace(',', ''))
                if value:
                    query_values.append(float(value[0]))

            doc_values = []
            for amount in doc_amounts:
                value = re.findall(r'[\d,]+(?:\.\d+)?', amount.replace(',', ''))
                if value:
                    doc_values.append(float(value[0]))

            if not query_values or not doc_values:
                return 0.0

            # 計算最接近的金額相似度
            max_similarity = 0.0
            for q_val in query_values:
                for d_val in doc_values:
                    # 使用比例計算相似度
                    if q_val > 0 and d_val > 0:
                        ratio = min(q_val, d_val) / max(q_val, d_val)
                        max_similarity = max(max_similarity, ratio)

            return max_similarity

        except:
            return 0.0
    
    async def search_csv(self, file_path: str, search_query: str,
                        similarity_threshold: float = 0.1,
                        max_results: int = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """在 CSV 文件中進行進階指紋搜尋（優化版）"""

        start_time = time.time()

        # 讀取 CSV 文件
        try:
            df = pd.read_csv(file_path, encoding='utf-8')
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(file_path, encoding='big5')
            except:
                df = pd.read_csv(file_path, encoding='cp1252')

        if df.empty:
            return df, {"total_processed": 0, "matches_found": 0}

        logger.info(f"🔍 開始進階搜尋，處理 {len(df)} 筆資料")

        # 1. 擴展查詢關鍵字
        expanded_keywords = await self.expand_query_keywords(search_query)
        logger.info(f"🔑 擴展關鍵字: {expanded_keywords[:5]}...")

        # 2. 計算語料庫統計信息
        corpus_stats = self._calculate_corpus_stats(df)

        # 3. 批次處理 embeddings（性能優化關鍵！）
        logger.info(f"🚀 開始批次 embedding 處理...")

        # 準備所有文本
        all_texts = []
        query_text = search_query

        for _, row in df.iterrows():
            subject = row.get('subject', '')
            content = row.get('snippet', '') + ' ' + row.get('content', '')
            full_text = f"{subject} {content}".strip()
            all_texts.append(full_text)

        # 批次獲取 embeddings（一次性處理所有文檔 + 查詢）
        all_input_texts = [query_text] + all_texts
        all_embeddings = self.batch_embeddings(all_input_texts, batch_size=35)

        if not all_embeddings:
            logger.error("❌ Embedding 處理失敗")
            return df, {"total_processed": len(df), "matches_found": 0}

        # 分離查詢和文檔 embeddings
        query_embedding = all_embeddings[0]
        doc_embeddings = all_embeddings[1:]

        logger.info(f"✅ Embedding 完成，開始計算相似度...")

        # 4. 並行計算相似度分數
        similarities = []
        detailed_scores = []

        for i, (_, row) in enumerate(df.iterrows()):
            doc_data = {
                'subject': row.get('subject', ''),
                'snippet': row.get('snippet', ''),
                'content': row.get('content', ''),
            }

            # 使用預計算的 embeddings
            doc_embedding = doc_embeddings[i] if i < len(doc_embeddings) else None

            score_dict = self.calculate_advanced_similarity_fast(
                search_query, expanded_keywords, doc_data, corpus_stats,
                query_embedding, doc_embedding
            )

            similarities.append(score_dict['total'])
            detailed_scores.append(score_dict)

        # 5. 添加相似度分數和詳細分數
        df['_similarity_score'] = similarities

        # 添加詳細分數欄位
        for i, score_dict in enumerate(detailed_scores):
            df.loc[i, '_bm25_subject'] = score_dict['bm25_subject']
            df.loc[i, '_bm25_body'] = score_dict['bm25_body']
            df.loc[i, '_semantic'] = score_dict['semantic']
            df.loc[i, '_entity'] = score_dict['entity']

        # 6. 過濾和排序結果
        filtered_df = df[df['_similarity_score'] >= similarity_threshold]
        filtered_df = filtered_df.sort_values('_similarity_score', ascending=False)

        # 7. 限制結果數量（可選）
        if max_results and len(filtered_df) > max_results:
            filtered_df = filtered_df.head(max_results)

        end_time = time.time()
        processing_time = end_time - start_time

        search_info = {
            "total_processed": len(df),
            "matches_found": len(filtered_df),
            "query": search_query,
            "expanded_keywords": expanded_keywords,
            "threshold": similarity_threshold,
            "max_results": max_results,
            "avg_similarity": filtered_df['_similarity_score'].mean() if not filtered_df.empty else 0,
            "score_distribution": self._analyze_score_distribution(similarities),
            "total_score": filtered_df['_similarity_score'].sum() if not filtered_df.empty else 0,
            "processing_time": processing_time
        }

        logger.info(f"⚡ 搜尋完成，耗時 {processing_time:.2f} 秒")

        return filtered_df, search_info

    def _calculate_corpus_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """計算語料庫統計信息，用於 BM25"""
        corpus_size = len(df)

        # Subject 統計
        subjects = df['subject'].fillna('').astype(str)
        subject_lengths = [len(self._tokenize(s)) for s in subjects]
        avg_subject_length = np.mean(subject_lengths) if subject_lengths else 1.0

        # Content 統計
        contents = df['snippet'].fillna('').astype(str)
        content_lengths = [len(self._tokenize(c)) for c in contents]
        avg_content_length = np.mean(content_lengths) if content_lengths else 1.0

        # Term frequency 統計
        subject_term_freq = Counter()
        content_term_freq = Counter()

        for subject in subjects:
            terms = set(self._tokenize(subject))
            for term in terms:
                subject_term_freq[term] += 1

        for content in contents:
            terms = set(self._tokenize(content))
            for term in terms:
                content_term_freq[term] += 1

        return {
            'corpus_size': corpus_size,
            'avg_subject_length': avg_subject_length,
            'avg_content_length': avg_content_length,
            'subject_term_freq': dict(subject_term_freq),
            'content_term_freq': dict(content_term_freq)
        }

    def _analyze_score_distribution(self, scores: List[float]) -> Dict[str, float]:
        """分析分數分佈"""
        if not scores:
            return {}

        scores_array = np.array(scores)
        return {
            'min': float(np.min(scores_array)),
            'max': float(np.max(scores_array)),
            'mean': float(np.mean(scores_array)),
            'std': float(np.std(scores_array)),
            'median': float(np.median(scores_array)),
            'q25': float(np.percentile(scores_array, 25)),
            'q75': float(np.percentile(scores_array, 75))
        }


# 全局搜尋引擎實例
search_engine = AdvancedFingerprintSearchEngine()


async def fingerprint_search_csv(
    file_path: str,
    search_query: str,
    session_id: str = "default",
    similarity_threshold: float = 0.1,
    max_results: int = None,
    save_results: bool = True
) -> Dict[str, Any]:
    """
    使用指紋搜尋技術在 CSV 文件中搜尋相關內容
    
    Args:
        file_path: CSV 檔案路徑
        search_query: 搜尋查詢詞
        session_id: 會話 ID
        similarity_threshold: 相似度閾值 (0.0-1.0)
        max_results: 最大返回結果數 (None 表示不限制)
        save_results: 是否保存結果到檔案
        
    Returns:
        搜尋結果的字典
    """
    try:
        logger.info(f"🔍 開始指紋搜尋: {search_query} in {file_path}")
        
        # 檢查文件是否存在
        if not os.path.exists(file_path):
            return {
                "success": False,
                "error": f"文件不存在: {file_path}"
            }
        
        # 執行搜尋
        result_df, search_info = await search_engine.search_csv(
            file_path, search_query, similarity_threshold, max_results
        )
        
        # 準備結果
        results_file = None
        if save_results and not result_df.empty:
            # 生成結果文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"fingerprint_search_{timestamp}.csv"
            results_file = session_data_manager.get_temp_file_path(session_id, filename)
            
            # 保存結果
            result_df.to_csv(results_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ 搜尋結果已保存到: {results_file}")
        
        # 準備樣本結果
        sample_results = []
        if not result_df.empty:
            sample_df = result_df.head(5)
            for _, row in sample_df.iterrows():
                sample_results.append({
                    "similarity_score": round(row.get('_similarity_score', 0), 4),
                    "data": row.drop('_similarity_score').to_dict()
                })
        
        return {
            "success": True,
            "total_matches": search_info["matches_found"],
            "total_processed": search_info["total_processed"],
            "results_file": results_file,
            "sample_results": sample_results,
            "search_info": search_info,
            "message": f"找到 {search_info['matches_found']} 筆匹配結果"
        }
        
    except Exception as e:
        logger.error(f"❌ 指紋搜尋失敗: {e}")
        return {
            "success": False,
            "error": f"搜尋失敗: {str(e)}"
        }
