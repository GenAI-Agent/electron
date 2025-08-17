#!/usr/bin/env python3
"""
Weaviate 啟動和管理腳本
提供簡單的命令行介面來管理 Weaviate 服務
"""

import os
import sys
import time
import subprocess
import argparse
import requests
from pathlib import Path

from .config import WeaviateConfig, WeaviateMode
from .utils.logger import setup_logger


logger = setup_logger("weaviate_starter")


class WeaviateManager:
    """Weaviate 服務管理器"""
    
    def __init__(self):
        self.docker_compose_path = Path(__file__).parent / "docker-compose.yml"
        self.config = WeaviateConfig.from_env()
        
    def start_local_docker(self) -> bool:
        """使用 Docker Compose 啟動本地 Weaviate"""
        try:
            logger.info("正在啟動本地 Weaviate 服務...")
            
            # 檢查 Docker 是否可用
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error("Docker 未安裝或無法使用")
                return False
            
            # 啟動 Weaviate
            result = subprocess.run(
                ["docker-compose", "-f", str(self.docker_compose_path), "up", "-d"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"啟動 Weaviate 失敗: {result.stderr}")
                return False
            
            logger.info("Weaviate 服務已啟動，等待服務就緒...")
            
            # 等待服務就緒
            return self.wait_for_ready()
            
        except Exception as e:
            logger.error(f"啟動 Weaviate 時發生錯誤: {e}")
            return False
    
    def stop_local_docker(self) -> bool:
        """停止本地 Weaviate 服務"""
        try:
            logger.info("正在停止 Weaviate 服務...")
            
            result = subprocess.run(
                ["docker-compose", "-f", str(self.docker_compose_path), "down"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"停止 Weaviate 失敗: {result.stderr}")
                return False
            
            logger.info("Weaviate 服務已停止")
            return True
            
        except Exception as e:
            logger.error(f"停止 Weaviate 時發生錯誤: {e}")
            return False
    
    def restart_local_docker(self) -> bool:
        """重啟本地 Weaviate 服務"""
        logger.info("正在重啟 Weaviate 服務...")
        return self.stop_local_docker() and self.start_local_docker()
    
    def check_status(self) -> bool:
        """檢查 Weaviate 服務狀態"""
        try:
            response = requests.get(
                f"{self.config.url}/v1/.well-known/ready",
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Weaviate 服務正常運行於 {self.config.url}")
                
                # 取得版本資訊
                try:
                    meta_response = requests.get(f"{self.config.url}/v1/meta")
                    if meta_response.status_code == 200:
                        meta_data = meta_response.json()
                        version = meta_data.get("version", "未知")
                        logger.info(f"📌 版本: {version}")
                except:
                    pass
                
                return True
            else:
                logger.warning(f"❌ Weaviate 服務回應異常: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            logger.error(f"❌ 無法連線到 Weaviate 服務 ({self.config.url})")
            return False
        except Exception as e:
            logger.error(f"❌ 檢查服務狀態時發生錯誤: {e}")
            return False
    
    def wait_for_ready(self, timeout: int = 60) -> bool:
        """等待 Weaviate 服務就緒"""
        logger.info(f"等待 Weaviate 服務就緒 (最多等待 {timeout} 秒)...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.check_status():
                logger.info("✅ Weaviate 服務已就緒")
                return True
            
            time.sleep(2)
            print(".", end="", flush=True)
        
        print()
        logger.error(f"❌ 等待超時，Weaviate 服務未在 {timeout} 秒內就緒")
        return False
    
    def show_logs(self):
        """顯示 Weaviate 服務日誌"""
        try:
            subprocess.run(
                ["docker-compose", "-f", str(self.docker_compose_path), "logs", "-f"],
                check=True
            )
        except KeyboardInterrupt:
            logger.info("停止顯示日誌")
        except Exception as e:
            logger.error(f"顯示日誌時發生錯誤: {e}")
    
    def reset_data(self, confirm: bool = False) -> bool:
        """重置所有資料 (危險操作)"""
        if not confirm:
            logger.warning("⚠️  重置資料需要確認參數 --confirm")
            return False
        
        try:
            logger.warning("🗑️  正在重置所有 Weaviate 資料...")
            
            # 停止服務
            self.stop_local_docker()
            
            # 刪除 Docker volume
            result = subprocess.run(
                ["docker", "volume", "rm", "vectordb_weaviate_data"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logger.info("✅ 資料已重置")
            else:
                logger.warning("⚠️  可能沒有資料需要刪除")
            
            # 重新啟動服務
            return self.start_local_docker()
            
        except Exception as e:
            logger.error(f"重置資料時發生錯誤: {e}")
            return False


def create_env_file():
    """建立環境變數範例檔案"""
    env_content = """# Weaviate 配置
WEAVIATE_MODE=local
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080
WEAVIATE_SCHEME=http

# 雲端配置 (WCS)
# WEAVIATE_MODE=cloud
# WEAVIATE_CLUSTER_URL=https://your-cluster.weaviate.network
# WEAVIATE_API_KEY=your-api-key

# OpenAI 配置 (可選)
# OPENAI_APIKEY=your-openai-api-key

# 其他配置
WEAVIATE_TIMEOUT=30
WEAVIATE_DATA_PATH=./weaviate_data
"""
    
    env_path = Path(".env")
    if not env_path.exists():
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        logger.info(f"✅ 已建立環境配置檔案: {env_path}")
    else:
        logger.info(f"📄 環境配置檔案已存在: {env_path}")


def main():
    """主函數"""
    parser = argparse.ArgumentParser(description="Weaviate 服務管理工具")
    parser.add_argument(
        "action",
        choices=["start", "stop", "restart", "status", "logs", "reset", "setup"],
        help="要執行的操作"
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="確認執行危險操作 (如重置資料)"
    )
    
    args = parser.parse_args()
    
    manager = WeaviateManager()
    
    if args.action == "setup":
        logger.info("🚀 設定 Weaviate 環境...")
        create_env_file()
        logger.info("✅ 環境設定完成")
        logger.info("\n📋 下一步:")
        logger.info("1. 編輯 .env 檔案設定您的配置")
        logger.info("2. 執行 'python start_weaviate.py start' 啟動服務")
        
    elif args.action == "start":
        if manager.start_local_docker():
            logger.info("🎉 Weaviate 服務啟動成功！")
            logger.info(f"🌐 服務地址: {manager.config.url}")
            logger.info("💡 您現在可以使用 VectorDB 客戶端連線")
        else:
            logger.error("❌ 啟動失敗")
            sys.exit(1)
            
    elif args.action == "stop":
        if manager.stop_local_docker():
            logger.info("🛑 Weaviate 服務已停止")
        else:
            sys.exit(1)
            
    elif args.action == "restart":
        if manager.restart_local_docker():
            logger.info("🔄 Weaviate 服務重啟成功")
        else:
            sys.exit(1)
            
    elif args.action == "status":
        manager.check_status()
        
    elif args.action == "logs":
        manager.show_logs()
        
    elif args.action == "reset":
        if manager.reset_data(args.confirm):
            logger.info("🗑️  資料重置完成")
        else:
            sys.exit(1)


if __name__ == "__main__":
    main()
