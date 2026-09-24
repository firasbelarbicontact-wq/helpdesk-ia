import base64
import logging
import os
import time
from enum import Enum

import ollama
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Configuration du modèle IA
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llava")
MAX_RETRIES = 2
MAX_DESCRIPTION_LENGTH = 2000

class Category(str, Enum):
    """Catégories de problèmes informatiques reconnues par l'IA."""
    RESEAU = "Réseau"
    MATERIEL = "Matériel informatique"
    LOGICIEL = "Logiciel"
    OS = "Système d'exploitation"
    SECURITE = "Sécurité"
    AUTRE = "Autre"

class TicketAnalysis(BaseModel):
    """Schéma Pydantic strict que l'IA doit obligatoirement respecter dans sa réponse."""
    category: Category
    causes: list[str] = Field(min_length=2, max_length=4)
    solutions: list[str] = Field(min_length=2, max_length=4)

# Prompt système définissant le rôle et les règles de l'IA
SYSTEM_PROMPT = """Tu es un expert en support informatique (HelpDesk) avec 15 ans d'expérience.
Réponds TOUJOURS en français.
Réponds UNIQUEMENT avec un objet JSON valide respectant strictement le schéma fourni,
sans texte, explication ni balise Markdown avant ou après.
Les solutions doivent être concrètes et actionnables, qu'un technicien peut suivre immédiatement."""

def _build_user_prompt(description: str, has_image: bool) -> str:
    """Construit le prompt utilisateur en injectant la description et le contexte visuel."""
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

def analyze_ticket_with_ai(description: str, image_base64: str | None = None) -> dict:
    """
    Analyse un ticket HelpDesk avec le modèle Ollama (Llava).
    Gère les erreurs avec un système de retries et un fallback de sécurité.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(description, has_image=bool(image_base64))},
    ]

    # Llava est un modèle multimodal : il peut analyser du texte ET des images
    if image_base64:
        try:
            messages[1]["images"] = [base64.b64decode(image_base64)]
        except Exception:
            logger.warning("Image base64 invalide : analyse poursuivie sans image.")

    last_error: Exception | None = None

    # Système de retries pour gérer la latence ou les erreurs ponctuelles de l'IA
    for attempt in range(1, MAX_RETRIES + 2):
        try:
            response = ollama.chat(
                model=MODEL_NAME,
                messages=messages,
                # Astuce majeure : on force Ollama à structurer sa réponse selon notre schéma Pydantic
                format=TicketAnalysis.model_json_schema(),
                options={
                    "temperature": 0.2,  # Température basse = peu de créativité = réponses stables et factuelles
                    "top_p": 0.9,
                    "seed": 42,          # Seed fixe pour la reproductibilité (même ticket = même réponse)
                    "num_predict": 600,  # Limite de tokens pour maîtriser la latence
                },
            )
            raw = _clean_json(response["message"]["content"])

            # Validation de la réponse de l'IA par Pydantic
            data = TicketAnalysis.model_validate_json(raw)
            return data.model_dump(mode="json")

        except Exception as e:
            last_error = e
            logger.warning("Tentative %s/%s échouée : %s", attempt, MAX_RETRIES + 1, e)
            if attempt <= MAX_RETRIES:
                time.sleep(attempt)  # Petit backoff linéaire avant de réessayer

    # Fallback de sécurité : si l'IA échoue après plusieurs tentatives, on renvoie une réponse par défaut
    logger.error("Analyse IA impossible après %s tentatives : %s", MAX_RETRIES + 1, last_error)
    return {
        "category": Category.AUTRE.value,
        "causes": ["Impossible d'analyser les causes pour le moment."],
        "solutions": ["Veuillez contacter un administrateur ou réessayer plus tard."],
    }

# Permet de tester le service IA indépendamment en ligne de commande
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = analyze_ticket_with_ai("Mon écran reste noir au démarrage de l'ordinateur.")
    print(result)