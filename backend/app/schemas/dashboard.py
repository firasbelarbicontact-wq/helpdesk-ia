from pydantic import BaseModel

class DashboardStats(BaseModel):
    total_tickets: int
    resolved_tickets: int
    in_progress_tickets: int
    new_tickets: int
    total_employes: int
    total_technicians: int