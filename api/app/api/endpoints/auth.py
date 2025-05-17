from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

from app.models.schemas import TokenResponse, AuthStatus

# Constants for JWT
SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class User(BaseModel):
    username: str
    openai_api_key: Optional[str] = None


# Simulated user database - in production, use a real database
fake_users_db = {}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validate and decode JWT token to get current user
    
    Args:
        token: JWT token
        
    Returns:
        User object if token is valid
        
    Raises:
        HTTPException: If token is invalid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username not in fake_users_db:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    return fake_users_db[username]


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate user and provide access token
    
    Args:
        form_data: Username and password form data
        
    Returns:
        TokenResponse with access token
        
    Raises:
        HTTPException: If authentication fails
    """
    # In a real implementation, validate credentials against a database
    # For this example, we'll create a user if it doesn't exist
    if form_data.username not in fake_users_db:
        fake_users_db[form_data.username] = User(
            username=form_data.username,
            openai_api_key=form_data.password  # Using password field for API key
        )
    
    user = fake_users_db[form_data.username]
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """
    Refresh access token
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        TokenResponse with new access token
    """
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.username}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/status", response_model=AuthStatus)
async def check_auth_status(request: Request):
    """
    Check authentication status
    
    Args:
        request: Request object
        
    Returns:
        AuthStatus indicating if user is authenticated
    """
    authorization = request.headers.get("Authorization")
    
    if not authorization or not authorization.startswith("Bearer "):
        return AuthStatus(authenticated=False)
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username not in fake_users_db:
            return AuthStatus(authenticated=False)
        
        return AuthStatus(authenticated=True, username=username)
    except JWTError:
        return AuthStatus(authenticated=False, error="Invalid token")


@router.post("/validate-openai-key")
async def validate_openai_key(api_key: str, current_user: User = Depends(get_current_user)):
    """
    Validate OpenAI API key
    
    Args:
        api_key: OpenAI API key to validate
        current_user: Current authenticated user
        
    Returns:
        Validation result
        
    Raises:
        HTTPException: If validation fails
    """
    # In a real implementation, validate the API key with OpenAI
    # For this example, we'll just update the user's API key
    fake_users_db[current_user.username].openai_api_key = api_key
    
    return {"valid": True, "message": "API key validated successfully"}
