from pydantic import BaseModel

class CategoryResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True