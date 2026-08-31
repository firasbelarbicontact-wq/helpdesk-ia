from pydantic import BaseModel
from typing import List, Optional

# Ce schéma est utilisé pour l'API /analyze (ce qu'on renvoie à l'utilisateur)
class AIAnalysisResponse(BaseModel):
    category: str
    causes: List[str]
    solutions: List[str]

# Ce schéma est utilisé quand on renvoie un Ticket (ce qui est stocké en DB)
class AIAnalysisDBResponse(BaseModel):
    possible_causes: Optional[List[str]] = None
    suggested_solutions: Optional[List[str]] = None

    class Config:
        from_attributes = True