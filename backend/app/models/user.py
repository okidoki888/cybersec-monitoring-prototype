from pydantic import BaseModel


class UserBase(BaseModel):
    username: str
    role: str = "viewer"
    is_active: bool = True


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"


class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None



