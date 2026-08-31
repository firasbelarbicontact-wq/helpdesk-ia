import base64
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.services.ai_service import analyze_ticket_with_ai
from app.schemas.ai import AIAnalysisResponse
from app.models.ticket import Ticket
from app.models.category import Category
from app.models.interaction import AIAnalysis

router = APIRouter(prefix="/api/ai", tags=["Intelligence Artificielle"])

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_ticket(
    description: str = Form(...), 
    ticket_id: str = Form(None), # Optionnel : si on analyse un ticket déjà créé
    file: UploadFile = File(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyse la description et l'image du problème avec l'IA"""
    image_base64 = None
    
    if file:
        image_bytes = await file.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
    # 1. Appeler l'IA
    ai_result = analyze_ticket_with_ai(description, image_base64)
    
    # 2. Si un ticket_id est fourni, on sauvegarde l'analyse en base de données
    if ticket_id:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket introuvable")
            
        # Trouver l'ID de la catégorie
        category = db.query(Category).filter(Category.name == ai_result["category"]).first()
        if category:
            ticket.category_id = category.id
            
        # Sauvegarder ou mettre à jour l'analyse IA
        existing_analysis = db.query(AIAnalysis).filter(AIAnalysis.ticket_id == ticket_id).first()
        if existing_analysis:
            existing_analysis.possible_causes = ai_result["causes"]
            existing_analysis.suggested_solutions = ai_result["solutions"]
        else:
            new_analysis = AIAnalysis(
                ticket_id=ticket_id,
                possible_causes=ai_result["causes"],
                suggested_solutions=ai_result["solutions"]
            )
            db.add(new_analysis)
            
        db.commit()
    
    return ai_result