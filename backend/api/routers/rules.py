"""
Rules API 路由

處理與規則相關的請求。
"""

import json
from pathlib import Path
from typing import List, Dict, Any
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


def load_rules_from_directory(rules_dir: str = "data/rules") -> List[Dict[str, Any]]:
    """從目錄載入所有規則"""
    # 使用與 main.py 相同的路徑解析邏輯
    if not Path(rules_dir).is_absolute():
        # 從當前文件位置找到項目根目錄
        current_file = Path(__file__)
        # backend/api/routers/rules.py -> backend/api/routers -> backend/api -> backend -> project_root
        project_root = current_file.parent.parent.parent.parent
        rules_path = project_root / rules_dir
    else:
        rules_path = Path(rules_dir)

    rules = []

    logger.info(f"🔍 當前文件: {current_file.absolute()}")
    logger.info(f"🔍 項目根目錄: {project_root.absolute()}")
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
