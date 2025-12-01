"""MITRE ATT&CK API integration."""
import logging
from typing import Dict, List, Any
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/mitre", tags=["mitre"])

# MITRE ATT&CK CTI STIX data from GitHub
MITRE_ENTERPRISE_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"

# Simple in-memory cache (в production использовать Redis)
_cache: Dict[str, Any] = {}


class Technique(BaseModel):
    """MITRE ATT&CK Technique."""
    id: str
    name: str
    description: str
    tactic: str
    platforms: List[str] = []
    external_id: str = ""


class Tactic(BaseModel):
    """MITRE ATT&CK Tactic."""
    id: str
    name: str
    description: str
    techniques: List[Technique]


async def fetch_mitre_data() -> Dict[str, Any]:
    """
    Получает данные MITRE ATT&CK из официального GitHub репозитория.
    Кэширует результаты для повышения производительности.
    """
    if "enterprise_data" in _cache:
        logger.info("Returning cached MITRE ATT&CK data")
        return _cache["enterprise_data"]

    try:
        logger.info(f"Fetching MITRE ATT&CK data from {MITRE_ENTERPRISE_URL}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(MITRE_ENTERPRISE_URL)
            response.raise_for_status()
            data = response.json()

        _cache["enterprise_data"] = data
        logger.info(f"Successfully fetched {len(data.get('objects', []))} MITRE objects")
        return data
    except Exception as e:
        logger.error(f"Failed to fetch MITRE ATT&CK data: {e}")
        raise HTTPException(status_code=503, detail=f"Failed to fetch MITRE data: {str(e)}")


def parse_techniques_and_tactics(mitre_data: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Парсит STIX данные и организует их по тактикам.
    """
    objects = mitre_data.get("objects", [])

    # Словари для быстрого поиска
    tactics_dict = {}
    techniques_dict = {}
    relationships = []

    # Первый проход: собираем тактики и техники
    for obj in objects:
        obj_type = obj.get("type", "")

        if obj_type == "x-mitre-tactic":
            tactic_id = obj.get("id")
            tactics_dict[tactic_id] = {
                "id": tactic_id,
                "name": obj.get("name", ""),
                "description": obj.get("description", ""),
                "shortname": obj.get("x_mitre_shortname", ""),
                "techniques": []
            }

        elif obj_type == "attack-pattern":
            technique_id = obj.get("id")
            external_refs = obj.get("external_references", [])
            external_id = ""
            for ref in external_refs:
                if ref.get("source_name") == "mitre-attack":
                    external_id = ref.get("external_id", "")
                    break

            techniques_dict[technique_id] = {
                "id": technique_id,
                "name": obj.get("name", ""),
                "description": obj.get("description", "")[:200] + "...",  # Краткое описание
                "external_id": external_id,
                "platforms": obj.get("x_mitre_platforms", []),
                "kill_chain_phases": obj.get("kill_chain_phases", [])
            }

        elif obj_type == "relationship":
            relationships.append(obj)

    # Второй проход: связываем техники с тактиками через kill chain phases
    for technique_id, technique in techniques_dict.items():
        for phase in technique.get("kill_chain_phases", []):
            tactic_name = phase.get("phase_name", "")
            # Находим тактику по shortname
            for tactic_id, tactic in tactics_dict.items():
                if tactic["shortname"] == tactic_name:
                    tactic["techniques"].append(technique)
                    break

    # Сортируем тактики в правильном порядке
    tactic_order = [
        "reconnaissance", "resource-development", "initial-access", "execution",
        "persistence", "privilege-escalation", "defense-evasion", "credential-access",
        "discovery", "lateral-movement", "collection", "command-and-control",
        "exfiltration", "impact"
    ]

    ordered_tactics = []
    for shortname in tactic_order:
        for tactic in tactics_dict.values():
            if tactic["shortname"] == shortname:
                ordered_tactics.append(tactic)
                break

    return {"tactics": ordered_tactics}


@router.get("/tactics")
async def get_tactics() -> Dict[str, List[Dict[str, Any]]]:
    """
    Получает список всех тактик MITRE ATT&CK с техниками.

    Returns:
        Словарь с массивом тактик, каждая содержит список техник.
    """
    mitre_data = await fetch_mitre_data()
    result = parse_techniques_and_tactics(mitre_data)
    return result


@router.get("/techniques")
async def get_techniques() -> List[Dict[str, Any]]:
    """
    Получает список всех техник MITRE ATT&CK.

    Returns:
        Список всех техник с метаданными.
    """
    mitre_data = await fetch_mitre_data()
    objects = mitre_data.get("objects", [])

    techniques = []
    for obj in objects:
        if obj.get("type") == "attack-pattern":
            external_refs = obj.get("external_references", [])
            external_id = ""
            for ref in external_refs:
                if ref.get("source_name") == "mitre-attack":
                    external_id = ref.get("external_id", "")
                    break

            techniques.append({
                "id": obj.get("id"),
                "name": obj.get("name"),
                "description": obj.get("description", "")[:200] + "...",
                "external_id": external_id,
                "platforms": obj.get("x_mitre_platforms", [])
            })

    return techniques


@router.post("/cache/clear")
async def clear_cache() -> Dict[str, str]:
    """
    Очищает кэш данных MITRE ATT&CK.
    Используйте для принудительного обновления данных.
    """
    _cache.clear()
    logger.info("MITRE ATT&CK cache cleared")
    return {"status": "success", "message": "Cache cleared"}
