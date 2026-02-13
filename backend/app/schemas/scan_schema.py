from pydantic import BaseModel
from typing import Optional

class ManualBatchVerify(BaseModel):
    batch_number: str
    manufacturer: Optional[str] = None
