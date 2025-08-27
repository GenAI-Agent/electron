"""
Data Analysis Tools

提供通用的數據分析方法工具，由 Agent 指定具體的列名和參數。
"""

import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Tuple
from scipy import stats
from sklearn.linear_model import LinearRegression
import logging

logger = logging.getLogger(__name__)


class DataAnalysisTools:
    """通用數據分析工具集"""

    def __init__(self):
        pass
    
    async def load_data_file(self, file_path: str) -> Dict[str, Any]:
        """
        加載數據文件，以 JSON 格式為主

        Args:
            file_path: 文件路徑

        Returns:
            包含數據和元信息的字典
        """
        file_ext = Path(file_path).suffix.lower()

        try:
            result = {
                "file_path": file_path,
                "file_type": file_ext,
                "data": None,
                "metadata": {}
            }

            if file_ext == '.json':
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                result["data"] = data
                result["metadata"]["original_format"] = "json"

            elif file_ext == '.csv':
                # CSV 轉換為 JSON 格式，處理多行欄位和編碼問題
                try:
                    # 嘗試不同的編碼和參數組合
                    encodings = ['utf-8', 'utf-8-sig', 'big5', 'gbk', 'cp1252']
                    df = None

                    for encoding in encodings:
                        try:
                            df = pd.read_csv(
                                file_path,
                                encoding=encoding,
                                quotechar='"',           # 指定引號字符
                                quoting=1,               # QUOTE_ALL
                                skipinitialspace=True,   # 跳過初始空格
                                on_bad_lines='skip',     # 跳過有問題的行
                                engine='python'          # 使用Python引擎，更好處理複雜CSV
                            )
                            logger.info(f"✅ 成功使用編碼 {encoding} 讀取CSV檔案")
                            break
                        except (UnicodeDecodeError, pd.errors.ParserError) as e:
                            logger.warning(f"⚠️ 編碼 {encoding} 讀取失敗: {e}")
                            continue

                    if df is None:
                        raise ValueError("無法使用任何編碼成功讀取CSV檔案")

                    # 清理數據：移除完全空白的行
                    df = df.dropna(how='all')

                    # 處理多行內容：將換行符號轉換為空格
                    for col in df.columns:
                        if df[col].dtype == 'object':  # 字符串列
                            df[col] = df[col].astype(str).str.replace('\n', ' ').str.replace('\r', ' ')

                    result["data"] = df.to_dict('records')
                    result["metadata"]["original_format"] = "csv"
                    result["metadata"]["columns"] = list(df.columns)
                    result["metadata"]["shape"] = df.shape

                except Exception as csv_error:
                    logger.error(f"CSV讀取失敗: {csv_error}")
                    raise ValueError(f"CSV檔案讀取失敗: {csv_error}")

            elif file_ext in ['.xlsx', '.xls']:
                # Excel 轉換為 JSON 格式
                df = pd.read_excel(file_path)
                result["data"] = df.to_dict('records')
                result["metadata"]["original_format"] = "excel"
                result["metadata"]["columns"] = list(df.columns)
                result["metadata"]["shape"] = df.shape

            else:
                raise ValueError(f"不支持的數據文件格式: {file_ext}")

            return result

        except Exception as e:
            logger.error(f"加載數據文件失敗 {file_path}: {e}")
            raise
    
    async def group_by_analysis(self, file_path: str, group_column: str, value_column: str,
                               operation: str = "sum", session_id: str = "default") -> Dict[str, Any]:
        """
        通用分組分析工具（基於 JSON 數據）

        Args:
            file_path: 數據文件路徑
            group_column: 分組列名
            value_column: 數值列名
            operation: 統計操作 (sum, mean, count, max, min)
            session_id: 會話ID

        Returns:
            分組分析結果
        """
        try:
            data_result = await self.load_data_file(file_path)
            data_list = data_result["data"]

            # 檢查數據格式
            if not isinstance(data_list, list) or not data_list:
                return {
                    "success": False,
                    "error": "數據格式不正確，需要是包含對象的數組"
                }

            # 檢查必要的列
            first_item = data_list[0]
            if group_column not in first_item or value_column not in first_item:
                available_keys = list(first_item.keys()) if isinstance(first_item, dict) else []
                return {
                    "success": False,
                    "error": f"缺少必要的列: {group_column} 或 {value_column}",
                    "available_columns": available_keys
                }

            # 手動進行分組分析
            groups = {}
            total_value = 0

            for item in data_list:
                if not isinstance(item, dict):
                    continue

                group_val = str(item.get(group_column, "未知"))
                value_val = item.get(value_column, 0)

                # 嘗試轉換為數字，處理各種格式
                try:
                    if value_val is None or value_val == "":
                        value_val = 0
                    else:
                        # 處理字符串格式的數字
                        if isinstance(value_val, str):
                            # 移除逗號和空格
                            value_val = value_val.replace(",", "").replace(" ", "").strip()
                            if value_val == "":
                                value_val = 0
                            else:
                                value_val = float(value_val)
                        else:
                            value_val = float(value_val)
                except (ValueError, TypeError):
                    logger.warning(f"⚠️ 無法轉換數值: {repr(item.get(value_column))} -> 設為 0")
                    value_val = 0

                if group_val not in groups:
                    groups[group_val] = []

                groups[group_val].append(value_val)
                total_value += value_val

            # 計算統計
            result = {
                "success": True,
                "analysis_type": "group_by_analysis",
                "session_id": session_id,
                "group_column": group_column,
                "value_column": value_column,
                "operation": operation,
                "results": {}
            }

            for group_val, values in groups.items():
                if values:
                    values_array = np.array(values)
                    stats = {
                        "count": len(values),
                        "sum": float(np.sum(values_array)),
                        "mean": float(np.mean(values_array)),
                        "median": float(np.median(values_array)),
                        "std": float(np.std(values_array)),
                        "min": float(np.min(values_array)),
                        "max": float(np.max(values_array))
                    }

                    # 根據operation返回主要結果
                    if operation in stats:
                        result["results"][group_val] = {
                            "value": stats[operation],
                            "all_stats": stats
                        }
                    else:
                        result["results"][group_val] = stats

            # 計算總體統計和佔比
            result["summary"] = {
                "total_value": float(total_value),
                "group_percentages": {}
            }

            for group_val in result["results"]:
                if total_value > 0:
                    # 安全地獲取 sum 值
                    group_result = result["results"][group_val]
                    if isinstance(group_result, dict):
                        if "all_stats" in group_result:
                            sum_value = group_result["all_stats"]["sum"]
                        elif "sum" in group_result:
                            sum_value = group_result["sum"]
                        else:
                            sum_value = 0
                    else:
                        sum_value = 0

                    percentage = (sum_value / total_value) * 100
                    result["summary"]["group_percentages"][group_val] = round(percentage, 2)

            return result

        except Exception as e:
            logger.error(f"分組分析失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def threshold_analysis(self, file_path: str, value_column: str, threshold: float,
                                comparison: str = "greater", session_id: str = "default") -> Dict[str, Any]:
        """
        通用閾值分析工具

        Args:
            file_path: 數據文件路徑
            value_column: 數值列名
            threshold: 閾值
            comparison: 比較方式 ('greater', 'less', 'equal')
            session_id: 會話ID

        Returns:
            閾值分析結果
        """
        try:
            data_result = await self.load_data_file(file_path)
            data_list = data_result["data"]

            # 檢查數據格式
            if not isinstance(data_list, list) or not data_list:
                return {
                    "success": False,
                    "error": "數據格式不正確，需要是包含對象的數組"
                }

            # 檢查列是否存在
            first_item = data_list[0] if data_list else {}
            if value_column not in first_item:
                available_keys = list(first_item.keys()) if isinstance(first_item, dict) else []
                return {
                    "success": False,
                    "error": f"缺少列 '{value_column}'",
                    "available_columns": available_keys
                }

            # 手動篩選數據
            filtered_items = []
            total_value = 0
            filtered_value = 0

            for item in data_list:
                if not isinstance(item, dict) or value_column not in item:
                    continue

                try:
                    value = float(item[value_column])
                    total_value += value

                    # 根據比較方式判斷
                    meets_condition = False
                    if comparison == "greater":
                        meets_condition = value > threshold
                        condition_desc = f"大於 {threshold}"
                    elif comparison == "less":
                        meets_condition = value < threshold
                        condition_desc = f"小於 {threshold}"
                    elif comparison == "equal":
                        meets_condition = value == threshold
                        condition_desc = f"等於 {threshold}"
                    else:
                        return {
                            "success": False,
                            "error": f"不支持的比較方式: {comparison}"
                        }

                    if meets_condition:
                        filtered_items.append(item)
                        filtered_value += value

                except (ValueError, TypeError):
                    continue

            # 計算統計
            total_records = len(data_list)
            filtered_count = len(filtered_items)

            # 計算佔比
            count_percentage = (filtered_count / total_records) * 100 if total_records > 0 else 0
            value_percentage = (filtered_value / total_value) * 100 if total_value > 0 else 0

            return {
                "success": True,
                "analysis_type": "threshold_analysis",
                "session_id": session_id,
                "value_column": value_column,
                "threshold": threshold,
                "comparison": comparison,
                "condition": condition_desc,
                "results": {
                    "total_records": total_records,
                    "total_value": float(total_value),
                    "filtered_records": filtered_count,
                    "filtered_value": float(filtered_value),
                    "count_percentage": round(count_percentage, 2),
                    "value_percentage": round(value_percentage, 2)
                },
                "filtered_data": filtered_items[:20]  # 只返回前20個結果
            }

        except Exception as e:
            logger.error(f"閾值分析失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def correlation_analysis(self, file_path: str, x_column: str, y_column: str,
                                  session_id: str = "default") -> Dict[str, Any]:
        """
        通用相關性分析工具

        Args:
            file_path: 數據文件路徑
            x_column: X軸變量列名
            y_column: Y軸變量列名
            session_id: 會話ID

        Returns:
            相關性分析結果
        """
        try:
            data_result = await self.load_data_file(file_path)
            data_list = data_result["data"]

            # 檢查數據格式
            if not isinstance(data_list, list) or not data_list:
                return {
                    "success": False,
                    "error": "數據格式不正確，需要是包含對象的數組"
                }

            # 檢查列是否存在
            first_item = data_list[0] if data_list else {}
            required_cols = [x_column, y_column]
            missing_cols = [col for col in required_cols if col not in first_item]
            if missing_cols:
                available_keys = list(first_item.keys()) if isinstance(first_item, dict) else []
                return {
                    "success": False,
                    "error": f"缺少必要的列: {missing_cols}",
                    "available_columns": available_keys
                }

            # 提取數值數據
            x_values = []
            y_values = []

            for item in data_list:
                if not isinstance(item, dict):
                    continue

                try:
                    x_val = float(item.get(x_column, 0))
                    y_val = float(item.get(y_column, 0))
                    x_values.append(x_val)
                    y_values.append(y_val)
                except (ValueError, TypeError):
                    continue

            if len(x_values) < 2 or len(y_values) < 2:
                return {
                    "success": False,
                    "error": "有效數據點不足，無法進行相關性分析"
                }

            # 轉換為 numpy 數組
            x_array = np.array(x_values)
            y_array = np.array(y_values)

            # 計算相關係數
            correlation = np.corrcoef(x_array, y_array)[0, 1]

            # 進行線性回歸
            X = x_array.reshape(-1, 1)
            y = y_array

            model = LinearRegression()
            model.fit(X, y)

            # 計算 R²
            r_squared = model.score(X, y)

            # 統計檢驗
            correlation_test = stats.pearsonr(x_array, y_array)

            return {
                "success": True,
                "analysis_type": "correlation_analysis",
                "session_id": session_id,
                "x_column": x_column,
                "y_column": y_column,
                "results": {
                    "correlation": round(correlation, 4),
                    "p_value": round(correlation_test[1], 4),
                    "r_squared": round(r_squared, 4),
                    "slope": round(model.coef_[0], 4),
                    "intercept": round(model.intercept_, 4),
                    "regression_equation": f"{y_column} = {round(model.coef_[0], 4)} × {x_column} + {round(model.intercept_, 4)}"
                },
                "interpretation": self._interpret_correlation(correlation),
                "model_params": {
                    "slope": float(model.coef_[0]),
                    "intercept": float(model.intercept_)
                },
                "data_points": len(x_values)
            }

        except Exception as e:
            logger.error(f"相關性分析失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def linear_prediction(self, file_path: str, x_column: str, y_column: str,
                               target_x_value: float, session_id: str = "default") -> Dict[str, Any]:
        """
        通用線性預測工具

        Args:
            file_path: 數據文件路徑
            x_column: 自變量列名
            y_column: 因變量列名
            target_x_value: 目標自變量值
            session_id: 會話ID

        Returns:
            預測結果
        """
        try:
            df = await self.load_data_file(file_path)

            required_cols = [x_column, y_column]
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                return {
                    "success": False,
                    "error": f"缺少必要的列: {missing_cols}",
                    "available_columns": list(df.columns)
                }

            # 確保兩列都是數字類型
            try:
                df[x_column] = pd.to_numeric(df[x_column], errors='coerce')
                df[y_column] = pd.to_numeric(df[y_column], errors='coerce')
            except:
                return {
                    "success": False,
                    "error": f"列 '{x_column}' 或 '{y_column}' 無法轉換為數字類型"
                }

            # 移除缺失值
            clean_df = df[[x_column, y_column]].dropna()

            if len(clean_df) < 2:
                return {
                    "success": False,
                    "error": "有效數據點不足，無法進行預測"
                }

            # 訓練模型
            X = clean_df[[x_column]]
            y = clean_df[y_column]

            model = LinearRegression()
            model.fit(X, y)

            # 預測
            predicted_value = model.predict([[target_x_value]])[0]

            # 計算預測區間（簡化版）
            residuals = y - model.predict(X)
            mse = np.mean(residuals ** 2)
            std_error = np.sqrt(mse)

            # 95% 預測區間
            confidence_interval = 1.96 * std_error
            lower_bound = predicted_value - confidence_interval
            upper_bound = predicted_value + confidence_interval

            # 找到相似值的實際數據
            value_range = abs(target_x_value * 0.1)  # ±10%
            similar_data = clean_df[
                (clean_df[x_column] >= target_x_value - value_range) &
                (clean_df[x_column] <= target_x_value + value_range)
            ]

            return {
                "success": True,
                "analysis_type": "linear_prediction",
                "session_id": session_id,
                "x_column": x_column,
                "y_column": y_column,
                "target_x_value": target_x_value,
                "prediction": {
                    "predicted_value": round(predicted_value, 4),
                    "confidence_interval_lower": round(lower_bound, 4),
                    "confidence_interval_upper": round(upper_bound, 4),
                    "confidence_interval": f"{round(lower_bound, 4)} - {round(upper_bound, 4)}"
                },
                "model_info": {
                    "regression_equation": f"{y_column} = {round(model.coef_[0], 4)} × {x_column} + {round(model.intercept_, 4)}",
                    "r_squared": round(model.score(X, y), 4),
                    "standard_error": round(std_error, 4)
                },
                "reference_data": {
                    "similar_range": f"{target_x_value - value_range:.2f} - {target_x_value + value_range:.2f}",
                    "similar_count": len(similar_data),
                    "similar_mean": round(similar_data[y_column].mean(), 4) if len(similar_data) > 0 else None,
                    "similar_range_values": f"{similar_data[y_column].min():.2f} - {similar_data[y_column].max():.2f}" if len(similar_data) > 0 else None
                },
                "data_points": len(clean_df)
            }

        except Exception as e:
            logger.error(f"線性預測失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _interpret_correlation(self, correlation: float) -> str:
        """解釋相關係數"""
        abs_corr = abs(correlation)
        
        if abs_corr >= 0.8:
            strength = "非常強"
        elif abs_corr >= 0.6:
            strength = "強"
        elif abs_corr >= 0.4:
            strength = "中等"
        elif abs_corr >= 0.2:
            strength = "弱"
        else:
            strength = "非常弱"
        
        direction = "正" if correlation > 0 else "負"
        
        return f"{direction}相關，相關強度：{strength}"
    
    async def get_data_info(self, file_path: str, session_id: str = "default") -> Dict[str, Any]:
        """
        獲取數據文件基本信息（基於 JSON 數據）

        Args:
            file_path: 數據文件路徑
            session_id: 會話ID

        Returns:
            數據文件信息
        """
        try:
            data_result = await self.load_data_file(file_path)
            data_list = data_result["data"]

            # 檢查數據格式
            if not isinstance(data_list, list) or not data_list:
                return {
                    "success": False,
                    "error": "數據格式不正確，需要是包含對象的數組"
                }

            # 分析數據結構
            first_item = data_list[0] if data_list else {}
            if not isinstance(first_item, dict):
                return {
                    "success": False,
                    "error": "數據項目格式不正確，需要是對象"
                }

            # 基本信息
            columns = list(first_item.keys())
            row_count = len(data_list)

            # 選擇最少NaN值的資料筆作為樣本
            def count_nan_values(row_dict):
                """計算一筆資料中的NaN值數量"""
                nan_count = 0
                for value in row_dict.values():
                    if value is None or value == "" or \
                       (isinstance(value, float) and np.isnan(value)) or \
                       (isinstance(value, str) and value.lower() in ['nan', 'null', 'none', 'na', '']):
                        nan_count += 1
                return nan_count

            # 對所有資料按NaN數量排序，選擇最少NaN的1筆作為樣本
            sorted_data = sorted(data_list, key=count_nan_values)
            best_sample_data = sorted_data[:1]  # 確保只返回1筆最完整的資料

            info = {
                "session_id": session_id,
                "total_rows": row_count,
                "columns": columns,
                "sample_data": best_sample_data,  # 只包含1筆最完整的樣本數據
                "data_shape": [row_count, len(columns)]  # 添加數據形狀信息
            }

            # 分析列類型和統計
            numeric_columns = []
            categorical_columns = []
            id_columns = []
            column_stats = {}

            def _is_id_column(col_name: str, numeric_values: list, non_null_values: list) -> bool:
                """檢測是否為ID類型的列"""
                if not numeric_values:
                    return False

                # 檢查列名是否包含ID相關關鍵字
                id_keywords = ['id', 'no', 'code', 'pk', 'key', 'ref']
                col_lower = col_name.lower()
                has_id_keyword = any(keyword in col_lower for keyword in id_keywords)

                # 檢查唯一性比例
                unique_ratio = len(set(str(v) for v in non_null_values)) / len(non_null_values) if non_null_values else 0

                # 檢查是否都是正整數
                all_positive_integers = all(isinstance(v, (int, float)) and v > 0 and v == int(v) for v in numeric_values)

                # 檢查數值範圍（ID通常是較大的數字）
                if numeric_values:
                    avg_value = sum(numeric_values) / len(numeric_values)
                    has_large_values = avg_value > 1000  # ID通常是較大的數字
                else:
                    has_large_values = False

                # 檢查長度一致性（轉為字符串後）
                str_lengths = [len(str(int(v))) for v in numeric_values if v == int(v)]
                length_consistency = len(set(str_lengths)) <= 2 if str_lengths else False  # 允許1-2種長度

                # ID判斷條件：
                # 1. 有ID關鍵字 + 高唯一性
                # 2. 或者：高唯一性 + 正整數 + 大數值 + 長度一致
                is_id = (has_id_keyword and unique_ratio > 0.8) or \
                       (unique_ratio > 0.95 and all_positive_integers and has_large_values and length_consistency)

                return is_id

            def _filter_valid_values(values: list) -> list:
                """過濾有效的數值，排除NaN和無效值"""
                valid_values = []
                for v in values:
                    if v is not None and v != "" and not (isinstance(v, float) and np.isnan(v)):
                        # 排除字符串形式的nan
                        if isinstance(v, str) and v.lower() in ['nan', 'null', 'none', '']:
                            continue
                        valid_values.append(v)
                return valid_values

            for col in columns:
                values = [item.get(col) for item in data_list if col in item]
                non_null_values = _filter_valid_values(values)

                # 嘗試判斷是否為數值列
                numeric_values = []
                for v in non_null_values:
                    try:
                        num_val = float(v)
                        # 排除NaN值
                        if not np.isnan(num_val):
                            numeric_values.append(num_val)
                    except (ValueError, TypeError):
                        break

                if len(numeric_values) == len(non_null_values) and numeric_values:
                    # 檢查是否為ID類型
                    if _is_id_column(col, numeric_values, non_null_values):
                        # ID列
                        id_columns.append(col)
                        column_stats[col] = {
                            "type": "id",
                            "count": len(numeric_values),
                            "valid_count": len(numeric_values),
                            "unique_count": len(set(numeric_values)),
                            "min": float(np.min(numeric_values)),
                            "max": float(np.max(numeric_values)),
                            "sample_values": [float(v) for v in numeric_values[:5]]
                        }
                    else:
                        # 數值列
                        numeric_columns.append(col)
                        # 使用有效數值計算統計量
                        valid_numeric = [v for v in numeric_values if not np.isnan(v)]
                        if valid_numeric:
                            column_stats[col] = {
                                "type": "numeric",
                                "count": len(values),  # 總數量
                                "valid_count": len(valid_numeric),  # 有效數字數量
                                "mean": float(np.mean(valid_numeric)),
                                "std": float(np.std(valid_numeric)),
                                "min": float(np.min(valid_numeric)),
                                "max": float(np.max(valid_numeric))
                            }
                        else:
                            column_stats[col] = {
                                "type": "numeric",
                                "count": len(values),
                                "valid_count": 0,
                                "mean": None,
                                "std": None,
                                "min": None,
                                "max": None
                            }
                else:
                    # 分類列
                    categorical_columns.append(col)
                    value_counts = {}
                    # 只統計有效值，排除各種形式的空值
                    for v in non_null_values:
                        str_v = str(v)
                        # 排除各種形式的空值
                        if str_v.lower() not in ['nan', 'null', 'none', '', 'na']:
                            value_counts[str_v] = value_counts.get(str_v, 0) + 1

                    # 取前5個最常見的值
                    top_values = dict(sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:5])

                    column_stats[col] = {
                        "type": "categorical",
                        "count": len(values),  # 總數量
                        "valid_count": len(non_null_values),  # 有效數據數量
                        "unique_count": len(value_counts),
                        "top_values": top_values
                    }

            info["numeric_columns"] = numeric_columns
            info["categorical_columns"] = categorical_columns
            info["id_columns"] = id_columns
            info["column_stats"] = column_stats

            return info

        except Exception as e:
            logger.error(f"獲取數據信息失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def group_by_analysis_multi_file(self, multi_file_data: Dict[str, Any],
                                         group_column: str, value_column: str,
                                         operation: str = "sum", session_id: str = "default") -> Dict[str, Any]:
        """
        對多檔案資料進行分組分析

        Args:
            multi_file_data: 多檔案資料
            group_column: 分組列名
            value_column: 數值列名
            operation: 操作類型
            session_id: 會話ID

        Returns:
            分組分析結果
        """
        try:
            logger.info(f"🔄 開始多檔案分組分析: {group_column} by {value_column} ({operation})")

            datasets = multi_file_data.get("datasets", [])
            all_data = []

            # 合併所有資料集的資料
            for dataset in datasets:
                data = dataset.get("data", [])
                for row in data:
                    # 添加資料來源標識
                    row_with_source = row.copy()
                    row_with_source["_source"] = dataset.get("source", "unknown")
                    row_with_source["_dataset_date"] = dataset.get("date", "")
                    all_data.append(row_with_source)

            if not all_data:
                return {
                    "success": False,
                    "error": "沒有可分析的資料"
                }

            # 轉換為 DataFrame
            df = pd.DataFrame(all_data)

            # 檢查欄位是否存在
            if group_column not in df.columns:
                return {
                    "success": False,
                    "error": f"分組欄位 '{group_column}' 不存在。可用欄位: {list(df.columns)}"
                }

            if value_column not in df.columns:
                return {
                    "success": False,
                    "error": f"數值欄位 '{value_column}' 不存在。可用欄位: {list(df.columns)}"
                }

            # 執行分組分析
            if operation == "count":
                grouped = df.groupby(group_column).size().reset_index(name='count')
                result_data = grouped.to_dict('records')
            else:
                # 嘗試轉換數值欄位
                try:
                    df[value_column] = pd.to_numeric(df[value_column], errors='coerce')
                except:
                    pass

                if operation == "sum":
                    grouped = df.groupby(group_column)[value_column].sum().reset_index()
                elif operation == "mean":
                    grouped = df.groupby(group_column)[value_column].mean().reset_index()
                elif operation == "max":
                    grouped = df.groupby(group_column)[value_column].max().reset_index()
                elif operation == "min":
                    grouped = df.groupby(group_column)[value_column].min().reset_index()
                else:
                    return {
                        "success": False,
                        "error": f"不支援的操作: {operation}"
                    }

                result_data = grouped.to_dict('records')

            # 按來源分組的統計
            source_stats = df.groupby(['_source', group_column]).size().reset_index(name='count')
            source_breakdown = {}
            for _, row in source_stats.iterrows():
                source = row['_source']
                if source not in source_breakdown:
                    source_breakdown[source] = {}
                source_breakdown[source][row[group_column]] = row['count']

            return {
                "success": True,
                "session_id": session_id,
                "analysis_type": f"multi_file_group_by_{operation}",
                "group_column": group_column,
                "value_column": value_column,
                "operation": operation,
                "total_records": len(all_data),
                "total_groups": len(result_data),
                "results": result_data,
                "source_breakdown": source_breakdown,
                "datasets_analyzed": len(datasets)
            }

        except Exception as e:
            logger.error(f"多檔案分組分析失敗: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# 全局工具實例
data_analysis_tools = DataAnalysisTools()


# 通用分析工具函數，供 Agent 調用
async def get_data_info_tool(file_path: str, session_id: str = "default") -> Dict[str, Any]:
    """獲取數據文件信息的工具函數"""
    return await data_analysis_tools.get_data_info(file_path, session_id)


# 注意：group_by_analysis_tool 已在 langchain_local_file_tools.py 中定義
# 這裡移除重複定義以避免衝突


async def threshold_analysis_tool(file_path: str, value_column: str, threshold: float,
                                 comparison: str = "greater", session_id: str = "default") -> Dict[str, Any]:
    """閾值分析工具函數"""
    return await data_analysis_tools.threshold_analysis(file_path, value_column, threshold, comparison, session_id)


async def correlation_analysis_tool(file_path: str, x_column: str, y_column: str,
                                   session_id: str = "default") -> Dict[str, Any]:
    """相關性分析工具函數"""
    return await data_analysis_tools.correlation_analysis(file_path, x_column, y_column, session_id)


async def linear_prediction_tool(file_path: str, x_column: str, y_column: str,
                                target_x_value: float, session_id: str = "default") -> Dict[str, Any]:
    """線性預測工具函數"""
    return await data_analysis_tools.linear_prediction(file_path, x_column, y_column, target_x_value, session_id)
