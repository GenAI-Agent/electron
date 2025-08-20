"""
Rules API 路由

處理與規則相關的請求。
"""

import json
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from supervisor_agent.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


class RuleCard(BaseModel):
    """規則卡片模型"""
    id: str
    name: str
    description: str
    model: str = "gpt-4o"
    tools: List[str] = []
    enabled: bool = True
    created_at: str = ""
    updated_at: str = ""


class RuleDetail(BaseModel):
    """規則詳細信息模型"""
    id: str
    name: str
    description: str
    model: str = "gpt-4o"
    tools: List[str] = []
    agents: List[str] = []
    prompt: str = ""
    enabled: bool = True
    created_at: str = ""
    updated_at: str = ""


class CreateRuleRequest(BaseModel):
    """創建規則請求模型"""
    name: str
    description: str
    model: str = "gpt-4o"
    tools: List[str] = []
    agents: List[str] = []
    prompt: str = ""
    enabled: bool = True


def get_rules_directory_path(rules_dir: str = "data/rules") -> Path:
    """獲取規則目錄的絕對路徑"""
    if not Path(rules_dir).is_absolute():
        current_file = Path(__file__)
        project_root = current_file.parent.parent.parent.parent
        rules_path = project_root / rules_dir
    else:
        rules_path = Path(rules_dir)
    return rules_path


def generate_rule_id(name: str, existing_rules: List[Dict[str, Any]]) -> str:
    """生成唯一的規則 ID"""
    # 基於名稱生成基礎 ID
    base_id = name.lower().replace(' ', '_').replace('-', '_')
    base_id = ''.join(c for c in base_id if c.isalnum() or c == '_')
    
    # 檢查是否已存在
    existing_ids = {rule.get('id', '') for rule in existing_rules}
    
    if base_id not in existing_ids:
        return base_id
    
    # 如果存在衝突，添加數字後綴
    counter = 1
    while f"{base_id}_{counter}" in existing_ids:
        counter += 1
    
    return f"{base_id}_{counter}"


def load_rules_from_directory(rules_dir: str = "data/rules") -> List[Dict[str, Any]]:
    """從目錄載入所有規則"""
    rules_path = get_rules_directory_path(rules_dir)

    rules = []

    logger.info(f"🔍 嘗試載入規則目錄: {rules_path.absolute()}")

    if not rules_path.exists():
        logger.warning(f"規則目錄不存在: {rules_path.absolute()}")
        return rules
    
    json_files = list(rules_path.glob("*.json"))
    logger.info(f"🔍 找到 {len(json_files)} 個 JSON 文件: {[f.name for f in json_files]}")

    for rule_file in json_files:
        try:
            logger.info(f"📄 載入規則文件: {rule_file}")
            with open(rule_file, 'r', encoding='utf-8') as f:
                rule_data = json.load(f)
                rule_data['id'] = rule_file.stem  # 使用文件名作為 ID
                rules.append(rule_data)
                logger.info(f"✅ 成功載入規則: {rule_data.get('name', rule_file.stem)}")
        except Exception as e:
            logger.error(f"載入規則失敗 {rule_file}: {e}")

    logger.info(f"📋 總共載入了 {len(rules)} 個規則")
    return rules


@router.get("/debug")
async def debug_rules_path():
    """調試規則路徑"""
    try:
        from pathlib import Path

        # 測試各種路徑
        current_file = Path(__file__)
        project_root = current_file.parent.parent.parent.parent
        rules_dir = "data/rules"

        paths_info = {
            "current_file": str(current_file.absolute()),
            "project_root": str(project_root.absolute()),
            "project_root_exists": project_root.exists(),
            "rules_path": str(project_root / rules_dir),
            "rules_path_exists": (project_root / rules_dir).exists(),
            "cwd": str(Path.cwd()),
            "cwd_rules_exists": (Path.cwd() / rules_dir).exists()
        }

        # 嘗試列出文件
        rules_path = project_root / rules_dir
        if rules_path.exists():
            json_files = list(rules_path.glob("*.json"))
            paths_info["json_files"] = [f.name for f in json_files]
        else:
            paths_info["json_files"] = []

        return paths_info

    except Exception as e:
        logger.error(f"調試路徑失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[RuleCard])
async def list_rules():
    """獲取所有規則列表（卡片格式）"""
    try:
        rules_data = load_rules_from_directory()

        rule_cards = []
        for rule in rules_data:
            # 截斷描述文字
            description = rule.get('description', '')
            if len(description) > 100:
                description = description[:100] + "..."

            rule_card = RuleCard(
                id=rule.get('id', ''),
                name=rule.get('name', ''),
                description=description,
                model=rule.get('model', 'gpt-4o'),
                tools=rule.get('tools', []),
                enabled=rule.get('enabled', True),
                created_at=rule.get('created_at', ''),
                updated_at=rule.get('updated_at', '')
            )
            rule_cards.append(rule_card)

        return rule_cards

    except Exception as e:
        logger.error(f"獲取規則列表失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{rule_id}", response_model=RuleDetail)
async def get_rule_detail(rule_id: str):
    """獲取特定規則的詳細信息"""
    try:
        rules_data = load_rules_from_directory()

        # 查找指定的規則
        rule = None
        for r in rules_data:
            if r.get('id') == rule_id or r.get('name') == rule_id:
                rule = r
                break

        if not rule:
            raise HTTPException(status_code=404, detail=f"規則不存在: {rule_id}")

        rule_detail = RuleDetail(
            id=rule.get('id', ''),
            name=rule.get('name', ''),
            description=rule.get('description', ''),
            model=rule.get('model', 'gpt-4o'),
            tools=rule.get('tools', []),
            agents=rule.get('agents', []),
            prompt=rule.get('prompt', ''),
            enabled=rule.get('enabled', True),
            created_at=rule.get('created_at', ''),
            updated_at=rule.get('updated_at', '')
        )

        return rule_detail

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"獲取規則詳情失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/count")
async def get_rules_count():
    """獲取規則數量統計"""
    try:
        rules_data = load_rules_from_directory()
        enabled_count = sum(1 for rule in rules_data if rule.get('enabled', True))

        return {
            "total": len(rules_data),
            "enabled": enabled_count,
            "disabled": len(rules_data) - enabled_count
        }

    except Exception as e:
        logger.error(f"獲取規則統計失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=RuleDetail)
async def create_rule(rule_request: CreateRuleRequest):
    """創建新規則"""
    try:
        # 載入現有規則以檢查 ID 衝突
        existing_rules = load_rules_from_directory()
        
        # 生成唯一的 ID
        rule_id = generate_rule_id(rule_request.name, existing_rules)
        
        # 創建時間戳
        now = datetime.now().isoformat()
        
        # 構建規則數據
        rule_data = {
            "id": rule_id,
            "name": rule_request.name,
            "description": rule_request.description,
            "model": rule_request.model,
            "tools": rule_request.tools,
            "agents": rule_request.agents,
            "prompt": rule_request.prompt,
            "enabled": rule_request.enabled,
            "created_at": now,
            "updated_at": now
        }
        
        # 獲取規則目錄路徑
        rules_path = get_rules_directory_path()
        
        # 確保目錄存在
        rules_path.mkdir(parents=True, exist_ok=True)
        
        # 文件路徑
        rule_file_path = rules_path / f"{rule_id}.json"
        
        # 檢查文件是否已存在
        if rule_file_path.exists():
            raise HTTPException(status_code=409, detail=f"規則文件已存在: {rule_id}")
        
        # 寫入 JSON 文件
        with open(rule_file_path, 'w', encoding='utf-8') as f:
            json.dump(rule_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✅ 成功創建規則: {rule_data['name']} (ID: {rule_id})")
        
        # 返回創建的規則詳情
        return RuleDetail(**rule_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"創建規則失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{rule_id}")
async def delete_rule(rule_id: str):
    """刪除指定的規則"""
    try:
        # 載入現有規則以確認規則存在
        existing_rules = load_rules_from_directory()
        
        # 查找指定的規則
        rule_exists = False
        for rule in existing_rules:
            if rule.get('id') == rule_id or rule.get('name') == rule_id:
                rule_exists = True
                break
        
        if not rule_exists:
            raise HTTPException(status_code=404, detail=f"規則不存在: {rule_id}")
        
        # 獲取規則目錄路徑
        rules_path = get_rules_directory_path()
        
        # 構建文件路徑（使用 rule_id 作為文件名）
        rule_file_path = rules_path / f"{rule_id}.json"
        
        # 檢查文件是否存在
        if not rule_file_path.exists():
            raise HTTPException(status_code=404, detail=f"規則文件不存在: {rule_id}")
        
        # 刪除文件
        rule_file_path.unlink()
        
        logger.info(f"✅ 成功刪除規則: {rule_id}")
        
        return {"message": f"規則 {rule_id} 已成功刪除", "deleted_rule_id": rule_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"刪除規則失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))
