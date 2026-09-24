from pydantic import BaseModel

# Schéma utilisé pour l'API /analyze (ce qu'on renvoie au frontend)
class AIAnalysisResponse(BaseModel):
    category: str
    causes: list[str]
    solutions: list[str]

# Schéma utilisé quand on renvoie un Ticket (ce qui est stocké en DB)
class AIAnalysisDBResponse(BaseModel):
    possible_causes: list[str] | None = None
    suggested_solutions: list[str] | None = None

    class Config:
        from_attributes = True # Permet de lire les données depuis un objet SQLAlchemy