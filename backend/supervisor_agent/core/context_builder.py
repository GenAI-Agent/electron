"""
Context Builder - 處理上下文構建邏輯
從 context 數據中提取信息並構建適當的查詢指令
"""

import json
from typing import Dict, Any, List, Tuple
from ..prompts import (
    MULTI_FILE_ANALYSIS_SUMMARY,
    GMAIL_FILE_SUMMARY,
    GMAIL_METADATA_SUMMARY,
    GENERAL_FILE_SUMMARY,
    GENERAL_DATA_INFO_SUMMARY,
    INSTRUCTION_WITH_RULE,
    INSTRUCTION_FOR_MAILS,
    INSTRUCTION_FOR_PAGE,
    INSTRUCTION_DEFAULT,
)


def build_context_query(
    query: str, context: Dict[str, Any], has_rule: bool = False
) -> str:
    """
    構建包含 context 信息的用戶查詢

    Args:
        query: 用戶查詢
        context: 上下文信息
        has_rule: 是否有規則

    Returns:
        構建好的指令字符串
    """
    # 提取關鍵信息
    context_data = context.get("context_data", {})

    # 構建數據摘要
    data_summary = _build_data_summary(context_data)

    # 根據不同情況構建指令
    instruction = _build_instruction(query, context_data, data_summary, has_rule)

    return instruction


def _build_data_summary(context_data: Dict[str, Any]) -> str:
    """
    根據 context_data 構建數據摘要

    Args:
        context_data: 上下文數據

    Returns:
        數據摘要字符串
    """
    # 提取基本信息
    file_path = context_data.get("file_path", "未知文件")
    data_info = context_data.get("data_info", {})
    file_summary = context_data.get("file_summary", {})
    email_address = context_data.get("email_address", "")

    # 檢查是否為多檔案分析模式
    is_multi_file = context_data.get("mode") == "multi_file_analysis"
    if is_multi_file:
        return _build_multi_file_summary(context_data)

    # 檢查是否為 Gmail 數據
    if file_summary and file_summary.get("file_type") == "gmail_csv":
        return _build_gmail_file_summary(
            context_data, file_summary, email_address, file_path
        )
    elif email_address and context_data.get("gmail_metadata"):
        return _build_gmail_metadata_summary(context_data, email_address, file_path)

    # 一般數據文件摘要
    if file_summary:
        return _build_general_file_summary(file_summary, file_path)
    elif data_info:
        return _build_general_data_info_summary(data_info, file_path)

    return ""


def _build_multi_file_summary(context_data: Dict[str, Any]) -> str:
    """構建多檔案分析模式的摘要"""
    files_summary = context_data.get("files_summary", {})
    total_files = context_data.get("total_files", 0)
    total_rows = files_summary.get("summary", {}).get("total_rows", 0)
    platform_types = context_data.get("platform_types", [])
    analysis_context = context_data.get("analysis_context", "")

    # 構建平台信息
    platform_info = f"{' vs '.join(platform_types)}" if platform_types else "多個平台"

    # 提取檔案詳細信息
    file_details = []
    for result in files_summary.get("results", []):
        if result.get("success"):
            platform_name = result.get("platform_name", "Unknown")
            platform_type = result.get("platform_type", "未知平台")
            rows = result.get("total_rows", 0)
            columns = result.get("columns", [])
            file_details.append(
                f"  - {platform_name} ({platform_type}): {rows} 行, {len(columns)} 欄位"
            )

    return MULTI_FILE_ANALYSIS_SUMMARY.format(
        analysis_context=analysis_context,
        total_files=total_files,
        platform_info=platform_info,
        total_rows=total_rows,
        file_details=chr(10).join(file_details),
        file_paths_json=json.dumps(context_data.get("file_paths", [])),
    )


def _build_gmail_file_summary(
    context_data: Dict[str, Any],
    file_summary: Dict[str, Any],
    email_address: str,
    file_path: str,
) -> str:
    """構建 Gmail 文件摘要"""
    total_emails = file_summary.get("total_emails", 0)
    unread_emails = file_summary.get("unread_emails", 0)
    top_senders = file_summary.get("top_senders", [])
    original_query = context_data.get("original_query", "")

    top_senders_str = ", ".join(
        [f"{sender}({count}封)" for sender, count in top_senders[:3]]
    )

    return GMAIL_FILE_SUMMARY.format(
        email_address=email_address,
        total_emails=total_emails,
        unread_emails=unread_emails,
        file_path=file_path,
        top_senders=top_senders_str,
        original_query=original_query,
        summary=file_summary.get("summary", ""),
    )


def _build_gmail_metadata_summary(
    context_data: Dict[str, Any], email_address: str, file_path: str
) -> str:
    """構建 Gmail 元數據摘要"""
    gmail_metadata = context_data.get("gmail_metadata", {})
    total_emails = gmail_metadata.get("total_emails", 0)
    original_query = context_data.get("original_query", "")

    return GMAIL_METADATA_SUMMARY.format(
        email_address=email_address,
        total_emails=total_emails,
        file_path=file_path,
        original_query=original_query,
        successful_batches=gmail_metadata.get("successful_batches", 0),
        failed_batches=gmail_metadata.get("failed_batches", 0),
    )


def _build_general_file_summary(file_summary: Dict[str, Any], file_path: str) -> str:
    """構建一般文件摘要"""
    total_rows = file_summary.get("total_emails", file_summary.get("total_rows", 0))
    columns = file_summary.get("columns", [])
    summary_text = file_summary.get("summary", "")

    columns_str = ", ".join(columns[:10])
    if len(columns) > 10:
        columns_str += "..."

    return GENERAL_FILE_SUMMARY.format(
        file_path=file_path,
        summary_text=summary_text,
        total_rows=total_rows,
        columns=columns_str,
    )


def _build_general_data_info_summary(data_info: Dict[str, Any], file_path: str) -> str:
    """構建一般數據信息摘要"""
    total_rows = data_info.get("total_rows", 0)
    columns = data_info.get("columns", [])
    numeric_columns = data_info.get("numeric_columns", [])
    categorical_columns = data_info.get("categorical_columns", [])

    numeric_columns_str = ", ".join(numeric_columns[:10])
    if len(numeric_columns) > 10:
        numeric_columns_str += "..."

    categorical_columns_str = ", ".join(categorical_columns[:10])
    if len(categorical_columns) > 10:
        categorical_columns_str += "..."

    return GENERAL_DATA_INFO_SUMMARY.format(
        file_path=file_path,
        total_rows=total_rows,
        columns_count=len(columns),
        numeric_columns=numeric_columns_str,
        categorical_columns=categorical_columns_str,
    )


def _build_instruction(
    query: str, context_data: Dict[str, Any], data_summary: str, has_rule: bool
) -> str:
    """
    根據不同情況構建指令

    Args:
        query: 用戶查詢
        context_data: 上下文數據
        data_summary: 數據摘要
        has_rule: 是否有規則

    Returns:
        指令字符串
    """
    # print(f"🔍 context_data!!!!: {context_data}")
    page_data = context_data.get("page", {})
    mails = context_data.get("mails", [])
    url = context_data.get("url", "")
    content = context_data.get("content", "")

    if has_rule:
        return INSTRUCTION_WITH_RULE.format(
            data_summary=data_summary, context_data=context_data, query=query
        )
    elif mails:
        return INSTRUCTION_FOR_MAILS.format(mails=mails, query=query)
    elif page_data or url:
        return INSTRUCTION_FOR_PAGE.format(
            page_data=page_data, content=content, url=url, query=query
        )
    else:
        return INSTRUCTION_DEFAULT.format(context_data=context_data, query=query)


def extract_context_info(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    從 context 中提取關鍵信息

    Args:
        context: 上下文信息

    Returns:
        提取的關鍵信息字典
    """
    context_data = context.get("context_data", {})

    return {
        "file_path": context_data.get("file_path", "未知文件"),
        "data_info": context_data.get("data_info", {}),
        "file_summary": context_data.get("file_summary", {}),
        "page_data": context_data.get("page", {}),
        "content": context_data.get("content", ""),
        "url": context_data.get("url", ""),
        "mails": context_data.get("mails", []),
        "is_multi_file": context_data.get("mode") == "multi_file_analysis",
        "files_summary": context_data.get("files_summary", {}),
        "platforms": context_data.get("platforms", []),
        "platform_types": context_data.get("platform_types", []),
        "analysis_context": context_data.get("analysis_context", ""),
        "email_address": context_data.get("email_address", ""),
        "gmail_metadata": context_data.get("gmail_metadata", {}),
        "original_query": context_data.get("original_query", ""),
    }
