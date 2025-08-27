"""
靈活指紋搜尋工具 - 可指定搜尋欄位的進階文字搜尋工具
基於原有的指紋搜尋概念，但允許用戶指定要搜尋的欄位名稱
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

# 初始化 Azure OpenAI client
embed_client = None
if EMBED_KEY and EMBED_END:
    try:
        embed_client = AzureOpenAI(
            api_key=EMBED_KEY,
            api_version="2024-02-01",
            azure_endpoint=EMBED_END
        )
    except Exception as e:
        logging.warning(f"無法初始化 Azure OpenAI client: {e}")

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


class FlexibleFingerprintSearchEngine:
    """靈活指紋搜尋引擎 - 可指定搜尋欄位"""

    def __init__(self):
        self.embedder = embedder
        self.llm_client = embed_client

        # BM25 參數
        self.k1 = 1.2  # term frequency saturation parameter
        self.b = 0.75  # length normalization parameter

        # 評分權重 (可動態調整)
        self.weights = {
            'bm25_primary': 2.5,    # 主要欄位權重
            'bm25_secondary': 1.2,  # 次要欄位權重
            'semantic': 1.5,
            'entity': 1.0
        }

    async def batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """批次處理 embeddings 以提高性能"""
        all_embeddings = []
        
        try:
            # 批次處理所有文本
            if embed_client and texts:
                response = embed_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=texts
                )
                all_embeddings = [data.embedding for data in response.data]
                logger.info(f"✅ 批次 embedding 成功，處理 {len(texts)} 個文本")

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
        """使用預定義規則擴展查詢關鍵字"""
        expansion_rules = {
            '財務': ['財務', 'finance', '金錢', 'money', '付款', 'payment', '發票', 'invoice', '帳單', 'bill', '費用', 'cost'],
            '客戶': ['客戶', 'customer', '用戶', 'user', '會員', 'member', '顧客', 'client', '消費者', 'consumer'],
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

    def _tokenize(self, text: str) -> List[str]:
        """簡單的中英文分詞"""
        if not text or pd.isna(text):
            return []
        
        text = str(text).lower()
        # 移除標點符號，保留中文、英文、數字
        text = re.sub(r'[^\w\u4e00-\u9fff\s]', ' ', text)
        # 分割並過濾空字符串
        tokens = [token.strip() for token in text.split() if token.strip()]
        return tokens

    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """提取實體（金額、日期等）"""
        if not text or pd.isna(text):
            return {}
        
        text = str(text)
        entities = {}
        
        # 提取金額
        amount_patterns = [
            r'\$[\d,]+\.?\d*',  # $1,000.00
            r'NT\$[\d,]+',      # NT$1000
            r'[\d,]+元',        # 1000元
            r'[\d,]+塊',        # 1000塊
        ]
        amounts = []
        for pattern in amount_patterns:
            amounts.extend(re.findall(pattern, text))
        if amounts:
            entities['amounts'] = amounts
        
        # 提取日期
        date_patterns = [
            r'\d{4}[-/]\d{1,2}[-/]\d{1,2}',  # 2023-01-01
            r'\d{1,2}[-/]\d{1,2}[-/]\d{4}',  # 01-01-2023
        ]
        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, text))
        if dates:
            entities['dates'] = dates
        
        return entities

    def calculate_bm25_score(self, query_terms: List[str], doc_terms: List[str], 
                           doc_length: int, avg_doc_length: float, 
                           corpus_size: int, term_freq: Dict[str, int]) -> float:
        """計算 BM25 分數"""
        if not query_terms or not doc_terms:
            return 0.0
        
        doc_term_freq = Counter(doc_terms)
        score = 0.0
        
        for term in query_terms:
            if term in doc_term_freq:
                tf = doc_term_freq[term]
                df = term_freq.get(term, 1)
                idf = math.log((corpus_size - df + 0.5) / (df + 0.5))
                
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * (doc_length / avg_doc_length))
                
                score += idf * (numerator / denominator)
        
        return max(0.0, score)

    def _normalize_bm25(self, bm25_score: float, max_expected: float = 8.0) -> float:
        """線性標準化 BM25 分數到 0-1 範圍"""
        if bm25_score <= 0:
            return 0.0
        normalized = min(1.0, bm25_score / max_expected)
        return normalized

    def _calculate_entity_match(self, query_entities: Dict[str, List[str]], 
                              doc_entities: Dict[str, List[str]]) -> float:
        """計算實體匹配分數"""
        if not query_entities:
            return 0.0

        total_matches = 0
        total_query_entities = 0

        for entity_type in query_entities:
            query_set = set(query_entities[entity_type])
            doc_set = set(doc_entities.get(entity_type, []))
            exact_matches = len(query_set & doc_set)
            total_matches += exact_matches
            total_query_entities += len(query_set)

        return total_matches / total_query_entities if total_query_entities > 0 else 0.0

    async def search_csv_flexible(self, file_path: str, search_query: str,
                                search_columns: List[str],
                                similarity_threshold: float = 0.1,
                                max_results: int = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """在 CSV 文件中進行靈活的指紋搜尋"""

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

        # 檢查指定的欄位是否存在
        missing_columns = [col for col in search_columns if col not in df.columns]
        if missing_columns:
            logger.warning(f"⚠️ 以下欄位不存在於CSV中: {missing_columns}")
            search_columns = [col for col in search_columns if col in df.columns]
            
        if not search_columns:
            logger.error("❌ 沒有有效的搜尋欄位")
            return pd.DataFrame(), {"total_processed": 0, "matches_found": 0, "error": "沒有有效的搜尋欄位"}

        logger.info(f"🔍 開始靈活搜尋，處理 {len(df)} 筆資料，搜尋欄位: {search_columns}")

        # 1. 擴展查詢關鍵字
        expanded_keywords = await self.expand_query_keywords(search_query)
        logger.info(f"🔑 擴展關鍵字: {expanded_keywords[:5]}...")

        # 2. 計算語料庫統計信息
        corpus_stats = self._calculate_corpus_stats_flexible(df, search_columns)

        # 3. 批次處理 embeddings
        logger.info(f"🚀 開始批次 embedding 處理...")

        # 準備所有文本
        all_texts = []
        query_text = search_query

        for _, row in df.iterrows():
            # 合併指定欄位的內容
            combined_text = ' '.join([str(row.get(col, '')) for col in search_columns])
            all_texts.append(combined_text.strip())

        # 批次處理 embeddings
        all_texts_with_query = [query_text] + all_texts
        all_embeddings = await self.batch_embeddings(all_texts_with_query)

        # 分離查詢和文檔 embeddings
        query_embedding = all_embeddings[0] if all_embeddings else []
        doc_embeddings = all_embeddings[1:] if len(all_embeddings) > 1 else []

        logger.info(f"✅ Embedding 完成，開始計算相似度...")

        # 4. 並行計算相似度分數
        similarities = []
        detailed_scores = []

        for i, (_, row) in enumerate(df.iterrows()):
            doc_data = {col: row.get(col, '') for col in search_columns}

            # 使用預計算的 embeddings
            doc_embedding = doc_embeddings[i] if i < len(doc_embeddings) else []

            score_dict = self.calculate_flexible_similarity(
                search_query, expanded_keywords, doc_data, corpus_stats,
                query_embedding, doc_embedding, search_columns
            )

            similarities.append(score_dict['total'])
            detailed_scores.append(score_dict)

        # 5. 添加相似度分數和詳細分數
        df['_similarity_score'] = similarities

        # 添加詳細分數欄位
        for i, score_dict in enumerate(detailed_scores):
            df.loc[i, '_bm25_primary'] = score_dict.get('bm25_primary', 0)
            df.loc[i, '_bm25_secondary'] = score_dict.get('bm25_secondary', 0)
            df.loc[i, '_semantic'] = score_dict.get('semantic', 0)
            df.loc[i, '_entity'] = score_dict.get('entity', 0)

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
            "search_columns": search_columns,
            "expanded_keywords": expanded_keywords,
            "threshold": similarity_threshold,
            "max_results": max_results,
            "avg_similarity": filtered_df['_similarity_score'].mean() if not filtered_df.empty else 0,
            "total_score": filtered_df['_similarity_score'].sum() if not filtered_df.empty else 0,
            "processing_time": processing_time
        }

        logger.info(f"⚡ 靈活搜尋完成，耗時 {processing_time:.2f} 秒")

        return filtered_df, search_info

    def _calculate_corpus_stats_flexible(self, df: pd.DataFrame, search_columns: List[str]) -> Dict[str, Any]:
        """計算語料庫統計信息（靈活版本）"""
        corpus_size = len(df)

        # 計算每個欄位的平均長度和詞頻
        column_stats = {}

        for col in search_columns:
            contents = df[col].fillna('').astype(str).tolist()
            lengths = [len(self._tokenize(content)) for content in contents]
            avg_length = sum(lengths) / len(lengths) if lengths else 0

            # 計算詞頻
            term_freq = Counter()
            for content in contents:
                terms = set(self._tokenize(content))
                for term in terms:
                    term_freq[term] += 1

            column_stats[col] = {
                'avg_length': avg_length,
                'term_freq': dict(term_freq)
            }

        return {
            'corpus_size': corpus_size,
            'column_stats': column_stats
        }

    def calculate_flexible_similarity(self, query: str, expanded_keywords: List[str],
                                    doc_data: Dict[str, str], corpus_stats: Dict[str, Any],
                                    query_embedding: List[float], doc_embedding: List[float],
                                    search_columns: List[str]) -> Dict[str, float]:
        """計算靈活的相似度分數"""
        scores = {}

        # 準備查詢詞彙
        query_terms = self._tokenize(' '.join(expanded_keywords))

        # 1. 計算每個欄位的 BM25 分數
        primary_col = search_columns[0] if search_columns else None
        secondary_cols = search_columns[1:] if len(search_columns) > 1 else []

        # 主要欄位 BM25
        if primary_col and primary_col in doc_data:
            primary_content = doc_data[primary_col]
            if primary_content:
                primary_terms = self._tokenize(primary_content)
                primary_stats = corpus_stats['column_stats'].get(primary_col, {})
                bm25_primary_raw = self.calculate_bm25_score(
                    query_terms, primary_terms, len(primary_terms),
                    primary_stats.get('avg_length', 1), corpus_stats['corpus_size'],
                    primary_stats.get('term_freq', {})
                )
                scores['bm25_primary'] = self._normalize_bm25(bm25_primary_raw)
            else:
                scores['bm25_primary'] = 0.0
        else:
            scores['bm25_primary'] = 0.0

        # 次要欄位 BM25（合併所有次要欄位）
        if secondary_cols:
            secondary_content = ' '.join([str(doc_data.get(col, '')) for col in secondary_cols])
            if secondary_content.strip():
                secondary_terms = self._tokenize(secondary_content)
                # 使用第一個次要欄位的統計信息作為代表
                secondary_stats = corpus_stats['column_stats'].get(secondary_cols[0], {})
                bm25_secondary_raw = self.calculate_bm25_score(
                    query_terms, secondary_terms, len(secondary_terms),
                    secondary_stats.get('avg_length', 1), corpus_stats['corpus_size'],
                    secondary_stats.get('term_freq', {})
                )
                scores['bm25_secondary'] = self._normalize_bm25(bm25_secondary_raw)
            else:
                scores['bm25_secondary'] = 0.0
        else:
            scores['bm25_secondary'] = 0.0

        # 2. 語義相似度
        if query_embedding and doc_embedding and len(query_embedding) == len(doc_embedding):
            try:
                query_vec = np.array(query_embedding).reshape(1, -1)
                doc_vec = np.array(doc_embedding).reshape(1, -1)
                semantic_sim = cosine_similarity(query_vec, doc_vec)[0][0]
                scores['semantic'] = max(0.0, semantic_sim)
            except Exception as e:
                logger.warning(f"語義相似度計算失敗: {e}")
                scores['semantic'] = 0.0
        else:
            scores['semantic'] = 0.0

        # 3. 實體匹配
        full_text = ' '.join([str(doc_data.get(col, '')) for col in search_columns])
        query_entities = self._extract_entities(query)
        doc_entities = self._extract_entities(full_text)
        scores['entity'] = self._calculate_entity_match(query_entities, doc_entities)

        # 計算加權總分
        total_score = (
            self.weights['bm25_primary'] * scores['bm25_primary'] +
            self.weights['bm25_secondary'] * scores['bm25_secondary'] +
            self.weights['semantic'] * scores['semantic'] +
            self.weights['entity'] * scores['entity']
        )

        scores['total'] = total_score
        return scores


# 創建搜尋引擎實例
flexible_search_engine = FlexibleFingerprintSearchEngine()


async def flexible_fingerprint_search_csv(
    file_path: str,
    search_query: str,
    search_columns: List[str],
    session_id: str = "default",
    similarity_threshold: float = 0.1,
    max_results: int = None,
    save_results: bool = True
) -> Dict[str, Any]:
    """
    使用靈活指紋搜尋技術在 CSV 文件中搜尋相關內容

    Args:
        file_path: CSV 檔案路徑
        search_query: 搜尋查詢詞
        search_columns: 要搜尋的欄位名稱列表
        session_id: 會話 ID
        similarity_threshold: 相似度閾值 (0.0-1.0)
        max_results: 最大返回結果數 (None 表示不限制)
        save_results: 是否保存結果到檔案

    Returns:
        搜尋結果的字典
    """
    try:
        logger.info(f"🔍 開始靈活指紋搜尋: '{search_query}' in {search_columns} from {file_path}")

        # 檢查文件是否存在
        if not os.path.exists(file_path):
            return {
                "success": False,
                "error": f"文件不存在: {file_path}"
            }

        # 執行搜尋
        result_df, search_info = await flexible_search_engine.search_csv_flexible(
            file_path, search_query, search_columns, similarity_threshold, max_results
        )

        # 準備結果
        results_file = None
        if save_results and not result_df.empty:
            # 生成結果文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"flexible_fingerprint_search_{timestamp}.csv"
            results_file = session_data_manager.get_temp_file_path(session_id, filename)

            # 保存結果
            result_df.to_csv(results_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ 搜尋結果已保存到: {results_file}")

        # 準備樣本結果
        sample_results = []
        if not result_df.empty:
            sample_df = result_df.head(5)
            for _, row in sample_df.iterrows():
                # 移除內部評分欄位
                clean_row = row.drop([col for col in row.index if col.startswith('_')])
                sample_results.append({
                    "similarity_score": round(row.get('_similarity_score', 0), 4),
                    "data": clean_row.to_dict()
                })

        return {
            "success": True,
            "total_matches": search_info["matches_found"],
            "total_processed": search_info["total_processed"],
            "search_columns": search_columns,
            "results_file": results_file,
            "sample_results": sample_results,
            "search_info": search_info,
            "message": f"在欄位 {search_columns} 中找到 {search_info['matches_found']} 筆匹配結果"
        }

    except Exception as e:
        logger.error(f"❌ 靈活指紋搜尋失敗: {e}")
        return {
            "success": False,
            "error": f"搜尋失敗: {str(e)}"
        }
