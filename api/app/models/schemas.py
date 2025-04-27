from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600


class AuthStatus(BaseModel):
    authenticated: bool
    username: Optional[str] = None
    error: Optional[str] = None


class ConversationBase(BaseModel):
    id: str
    title: str
    create_time: datetime
    update_time: datetime


class ConversationDetail(ConversationBase):
    messages: List[Dict[str, Any]]


class ConversationList(BaseModel):
    conversations: List[ConversationBase]
    total: int
    page: int
    page_size: int


class ConversationFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    title_contains: Optional[str] = None


class ChunkingConfig(BaseModel):
    chunk_size: int = 1000
    chunk_overlap: int = 200
    include_timestamps: bool = True


class SummarizationOptions(BaseModel):
    enabled: bool = False
    max_length: int = 500
    focus_recent: bool = True


class ProcessingConfig(BaseModel):
    chunking: ChunkingConfig = Field(default_factory=ChunkingConfig)
    summarization: SummarizationOptions = Field(default_factory=SummarizationOptions)


class ProcessingStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ProcessingTask(BaseModel):
    task_id: str
    status: ProcessingStatus
    progress: float = 0.0
    message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None


class ExportFormat(Enum):
    JSON = "json"
    CSV = "csv"
    TXT = "txt"


class ExportRequest(BaseModel):
    conversation_ids: List[str]
    format: ExportFormat = ExportFormat.JSON
    include_metadata: bool = True


class ExportResponse(BaseModel):
    export_id: str
    download_url: str


class InjectionConfig(BaseModel):
    max_tokens_per_request: int = 4000
    retry_attempts: int = 3
    retry_delay: int = 5  # seconds
    include_timestamps: bool = True
    include_titles: bool = True


class InjectionRequest(BaseModel):
    conversation_ids: List[str]
    config: InjectionConfig = Field(default_factory=InjectionConfig)


class InjectionStatus(BaseModel):
    task_id: str
    status: ProcessingStatus
    progress: float = 0.0
    message: Optional[str] = None
    successful_injections: int = 0
    failed_injections: int = 0


class WebSocketMessage(BaseModel):
    event: str
    data: Dict[str, Any]


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
