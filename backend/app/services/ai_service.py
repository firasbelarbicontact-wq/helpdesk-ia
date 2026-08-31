
import base64
import logging
import os
import time
from enum import Enum
from typing import Optional

import ollama
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("OLLAMA_MODEL", "llava")
MAX_RETRIES = 2
MAX_DESCRIPTION_LENGTH = 2000


class Category(str, Enum):
    RESEAU = "Réseau"
    MATERIEL = "Matériel informatique"
    LOGICIEL = "Logiciel"
    OS = "Système d'exploitation"
    SECURITE = "Sécurité"
    AUTRE = "Autre"


class TicketAnalysis(BaseModel):
    category: Category
    causes: list[str] = Field(min_length=2, max_length=4)
    solutions: list[str] = Field(min_length=2, max_length=4)


SYSTEM_PROMPT = """Tu es un expert en support informatique (HelpDesk) avec 15 ans d'expérience.
Réponds TOUJOURS en français.
Réponds UNIQUEMENT avec un objet JSON valide respectant strictement le schéma fourni,
sans texte, explication ni balise Markdown avant ou après.
Les solutions doivent être concrètes et actionnables, qu'un technicien peut suivre immédiatement."""


def _build_user_prompt(description: str, has_image: bool) -> str:
    description = description.strip()[:MAX_DESCRIPTION_LENGTH]
    contexte_image = (
        "Une capture d'écran ou une photo est jointe : appuie-toi dessus pour affiner le diagnostic."
        if has_image
        else "Aucune image n'a été fournie, base-toi uniquement sur la description."
    )
    return (
        f'Problème signalé par l\'employé : "{description}"\n\n'
        f"{contexte_image}\n\n"
        "Analyse ce ticket et retourne :\n"
        "- category : la catégorie la plus pertinente\n"
        "- causes : 2 à 4 causes probables, de la plus probable à la moins probable\n"
        "- solutions : 2 à 4 solutions concrètes, de la plus simple à la plus avancée"
    )


def _clean_json(raw: str) -> str:
    """Filet de sécurité : retire d'éventuelles balises Markdown parasites autour du JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
    return raw.strip()


def analyze_ticket_with_ai(description: str, image_base64: Optional[str] = None) -> dict:
    """Analyse un ticket HelpDesk et retourne {category, causes, solutions}."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(description, has_image=bool(image_base64))},
    ]
    
    if image_base64:
        try:
            messages[1]["images"] = [base64.b64decode(image_base64)]
        except Exception:
            logger.warning("Image base64 invalide : analyse poursuivie sans image.")

    last_error: Optional[Exception] = None
    for attempt in range(1, MAX_RETRIES + 2):
        try:
            response = ollama.chat(
                model=MODEL_NAME,
                messages=messages,
                format=TicketAnalysis.model_json_schema(),  # contraint la sortie au schéma -> JSON valide garanti
                options={
                    "temperature": 0.2,  # peu de créativité = réponses stables
                    "top_p": 0.9,
                    "seed": 42,          # même ticket -> même réponse (reproductibilité)
                    "num_predict": 600,  # borne la longueur -> latence maîtrisée
                },
            )
            raw = _clean_json(response["message"]["content"])
            data = TicketAnalysis.model_validate_json(raw)
            return data.model_dump(mode="json")

        except Exception as e:
            last_error = e
            logger.warning("Tentative %s/%s échouée : %s", attempt, MAX_RETRIES + 1, e)
            if attempt <= MAX_RETRIES:
                time.sleep(attempt)  # petit backoff avant de réessayer

    logger.error("Analyse IA impossible après %s tentatives : %s", MAX_RETRIES + 1, last_error)
    return {
        "category": Category.AUTRE.value,
        "causes": ["Impossible d'analyser les causes pour le moment."],
        "solutions": ["Veuillez contacter un administrateur ou réessayer plus tard."],
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = analyze_ticket_with_ai("Mon écran reste noir au démarrage de l'ordinateur.")
    print(result)