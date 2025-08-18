"""
Plotting Tools for LangChain Integration

提供繪圖和可視化工具，支持多種圖表類型。
"""

import json
import os
import tempfile
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
from langchain_core.tools import tool

try:
    import matplotlib
    matplotlib.use('Agg')  # 使用非交互式後端
    import matplotlib.pyplot as plt
    import matplotlib.font_manager as fm
    import seaborn as sns
    import pandas as pd
    import numpy as np
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False

from ..utils.logger import get_logger

logger = get_logger(__name__)

# 設置中文字體支持
if PLOTTING_AVAILABLE:
    plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans', 'Arial Unicode MS']
    plt.rcParams['axes.unicode_minus'] = False
    sns.set_style("whitegrid")


def _ensure_plotting_available():
    """確保繪圖庫可用"""
    if not PLOTTING_AVAILABLE:
        raise ImportError("繪圖功能需要安裝: pip install matplotlib seaborn pandas numpy")


@tool
async def create_line_chart_tool(data: List[Dict[str, Any]], x_column: str, y_column: str,
                                title: str = "線圖", width: int = 10, height: int = 6,
                                session_id: str = "default") -> str:
    """
    創建線圖
    
    Args:
        data: 數據列表，每個元素是包含x和y值的字典
        x_column: X軸數據的列名
        y_column: Y軸數據的列名
        title: 圖表標題
        width: 圖表寬度（英寸）
        height: 圖表高度（英寸）
        session_id: 會話ID
        
    Returns:
        圖表文件路徑的JSON字符串
    """
    try:
        _ensure_plotting_available()
        
        # 轉換數據為DataFrame
        df = pd.DataFrame(data)
        
        # 創建圖表
        plt.figure(figsize=(width, height))
        plt.plot(df[x_column], df[y_column], marker='o', linewidth=2, markersize=6)
        plt.title(title, fontsize=16, fontweight='bold')
        plt.xlabel(x_column, fontsize=12)
        plt.ylabel(y_column, fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        # 保存圖表
        temp_dir = Path(tempfile.gettempdir()) / "agent_plots" / session_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"line_chart_{len(data)}points.png"
        filepath = temp_dir / filename
        
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"✅ 線圖創建成功: {filepath}")
        
        return json.dumps({
            "success": True,
            "chart_type": "line_chart",
            "filepath": str(filepath),
            "title": title,
            "data_points": len(data),
            "message": f"成功創建線圖，包含 {len(data)} 個數據點"
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 創建線圖失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def create_bar_chart_tool(data: List[Dict[str, Any]], x_column: str, y_column: str,
                               title: str = "柱狀圖", width: int = 10, height: int = 6,
                               session_id: str = "default") -> str:
    """
    創建柱狀圖
    
    Args:
        data: 數據列表
        x_column: X軸數據的列名
        y_column: Y軸數據的列名
        title: 圖表標題
        width: 圖表寬度
        height: 圖表高度
        session_id: 會話ID
        
    Returns:
        圖表文件路徑的JSON字符串
    """
    try:
        _ensure_plotting_available()
        
        df = pd.DataFrame(data)
        
        plt.figure(figsize=(width, height))
        bars = plt.bar(df[x_column], df[y_column], alpha=0.8, color='steelblue')
        plt.title(title, fontsize=16, fontweight='bold')
        plt.xlabel(x_column, fontsize=12)
        plt.ylabel(y_column, fontsize=12)
        plt.xticks(rotation=45)
        
        # 在柱子上顯示數值
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f}', ha='center', va='bottom')
        
        plt.tight_layout()
        
        # 保存圖表
        temp_dir = Path(tempfile.gettempdir()) / "agent_plots" / session_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"bar_chart_{len(data)}items.png"
        filepath = temp_dir / filename
        
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"✅ 柱狀圖創建成功: {filepath}")
        
        return json.dumps({
            "success": True,
            "chart_type": "bar_chart",
            "filepath": str(filepath),
            "title": title,
            "data_points": len(data),
            "message": f"成功創建柱狀圖，包含 {len(data)} 個類別"
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 創建柱狀圖失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def create_scatter_plot_tool(data: List[Dict[str, Any]], x_column: str, y_column: str,
                                  title: str = "散點圖", width: int = 10, height: int = 6,
                                  session_id: str = "default") -> str:
    """
    創建散點圖
    
    Args:
        data: 數據列表
        x_column: X軸數據的列名
        y_column: Y軸數據的列名
        title: 圖表標題
        width: 圖表寬度
        height: 圖表高度
        session_id: 會話ID
        
    Returns:
        圖表文件路徑的JSON字符串
    """
    try:
        _ensure_plotting_available()
        
        df = pd.DataFrame(data)
        
        plt.figure(figsize=(width, height))
        plt.scatter(df[x_column], df[y_column], alpha=0.6, s=50, color='coral')
        plt.title(title, fontsize=16, fontweight='bold')
        plt.xlabel(x_column, fontsize=12)
        plt.ylabel(y_column, fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        # 保存圖表
        temp_dir = Path(tempfile.gettempdir()) / "agent_plots" / session_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"scatter_plot_{len(data)}points.png"
        filepath = temp_dir / filename
        
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"✅ 散點圖創建成功: {filepath}")
        
        return json.dumps({
            "success": True,
            "chart_type": "scatter_plot",
            "filepath": str(filepath),
            "title": title,
            "data_points": len(data),
            "message": f"成功創建散點圖，包含 {len(data)} 個數據點"
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 創建散點圖失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def create_pie_chart_tool(data: List[Dict[str, Any]], label_column: str, value_column: str,
                               title: str = "圓餅圖", width: int = 8, height: int = 8,
                               session_id: str = "default") -> str:
    """
    創建圓餅圖
    
    Args:
        data: 數據列表
        label_column: 標籤列名
        value_column: 數值列名
        title: 圖表標題
        width: 圖表寬度
        height: 圖表高度
        session_id: 會話ID
        
    Returns:
        圖表文件路徑的JSON字符串
    """
    try:
        _ensure_plotting_available()
        
        df = pd.DataFrame(data)
        
        plt.figure(figsize=(width, height))
        plt.pie(df[value_column], labels=df[label_column], autopct='%1.1f%%', startangle=90)
        plt.title(title, fontsize=16, fontweight='bold')
        plt.axis('equal')
        
        # 保存圖表
        temp_dir = Path(tempfile.gettempdir()) / "agent_plots" / session_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"pie_chart_{len(data)}categories.png"
        filepath = temp_dir / filename
        
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"✅ 圓餅圖創建成功: {filepath}")
        
        return json.dumps({
            "success": True,
            "chart_type": "pie_chart",
            "filepath": str(filepath),
            "title": title,
            "categories": len(data),
            "message": f"成功創建圓餅圖，包含 {len(data)} 個類別"
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 創建圓餅圖失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def list_session_plots_tool(session_id: str = "default") -> str:
    """
    列出會話的所有圖表文件
    
    Args:
        session_id: 會話ID
        
    Returns:
        圖表文件列表的JSON字符串
    """
    try:
        temp_dir = Path(tempfile.gettempdir()) / "agent_plots" / session_id
        
        if not temp_dir.exists():
            return json.dumps({
                "success": True,
                "plots": [],
                "count": 0,
                "message": "該會話尚未創建任何圖表"
            }, ensure_ascii=False)
        
        plot_files = []
        for file_path in temp_dir.glob("*.png"):
            plot_files.append({
                "filename": file_path.name,
                "filepath": str(file_path),
                "size": file_path.stat().st_size,
                "created": file_path.stat().st_mtime
            })
        
        return json.dumps({
            "success": True,
            "plots": plot_files,
            "count": len(plot_files),
            "session_id": session_id
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 列出圖表文件失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


# 導出所有繪圖工具
def get_langchain_plotting_tools():
    """獲取所有繪圖工具"""
    return [
        create_line_chart_tool,
        create_bar_chart_tool,
        create_scatter_plot_tool,
        create_pie_chart_tool,
        list_session_plots_tool
    ]
