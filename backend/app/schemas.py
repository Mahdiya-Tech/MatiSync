from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import datetime

# User & Auth
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: str
    cpse_code: Optional[str] = None
    cpse_id: Optional[int] = None
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# CPSE Org
class CPSEResponse(BaseModel):
    id: int
    code: str
    name: str
    sector: str
    status: str
    contact_email: Optional[str] = None
    last_upload: Optional[datetime.datetime] = None
    material_count: int = 0

# Material Schemas
class MaterialCreate(BaseModel):
    cpse_id: int
    material_code: str
    description: str
    category: Optional[str] = "General"
    subcategory: Optional[str] = None
    unit: Optional[str] = "NOS"
    material: Optional[str] = None
    grade: Optional[str] = None
    size: Optional[str] = None
    schedule: Optional[str] = None
    pressure_rating: Optional[str] = None
    standard: Optional[str] = None
    specification: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    part_number: Optional[str] = None
    annual_quantity: Optional[float] = 0.0
    annual_spend: Optional[float] = 0.0

class MaterialAttributeResponse(BaseModel):
    id: int
    attribute_name: str
    attribute_value: str
    raw_value: Optional[str] = None
    confidence: float
    extraction_method: str

class MaterialVersionResponse(BaseModel):
    id: int
    version_num: int
    changed_by: str
    changed_at: datetime.datetime
    change_type: str
    field_changed: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None

class MaterialDetailResponse(BaseModel):
    id: int
    cpse_id: int
    cpse_code: str
    cpse_name: str
    material_code: str
    
    # 4-stage data preservation
    original_description: str
    normalized_description: Optional[str] = None
    standardized_description: Optional[str] = None
    final_approved_description: Optional[str] = None
    
    category: str
    subcategory: Optional[str] = None
    original_unit: str
    normalized_unit: str
    
    # Technical attributes
    material_name: Optional[str] = None
    grade: Optional[str] = None
    size_raw: Optional[str] = None
    normalized_size_mm: Optional[float] = None
    schedule: Optional[str] = None
    pressure_rating: Optional[str] = None
    temperature_rating: Optional[str] = None
    standard: Optional[str] = None
    specification: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    part_number: Optional[str] = None
    
    annual_quantity: float
    annual_spend: float
    currency: str
    data_quality_score: float
    quality_issues_count: int
    quality_breakdown: Optional[Dict[str, Any]] = None
    status: str
    cnmc_id: Optional[int] = None
    cnmc_code: Optional[str] = None
    
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    attributes: List[MaterialAttributeResponse] = []
    versions: List[MaterialVersionResponse] = []
    mapped_cpse_codes: List[Dict[str, Any]] = []
    matches: List[Dict[str, Any]] = []
    conflicts: List[Dict[str, Any]] = []
    procurement_records: List[Dict[str, Any]] = []

class MaterialListItem(BaseModel):
    id: int
    cpse_code: str
    cpse_name: str
    material_code: str
    original_description: str
    normalized_description: Optional[str] = None
    category: str
    original_unit: str
    material_name: Optional[str] = None
    grade: Optional[str] = None
    normalized_size_mm: Optional[float] = None
    schedule: Optional[str] = None
    data_quality_score: float
    status: str
    cnmc_code: Optional[str] = None

# Search-Before-Create
class SearchBeforeCreateRequest(BaseModel):
    description: str
    cpse_id: Optional[int] = None
    category: Optional[str] = None

class SearchBeforeCreateMatch(BaseModel):
    material_id: int
    material_code: str
    cpse_code: str
    description: str
    cnmc_code: Optional[str] = None
    similarity_score: float
    relationship_type: str
    status: str
    has_conflict: bool
    conflict_summary: Optional[str] = None
    matching_specs: List[str] = []
    differing_specs: List[str] = []

class SearchBeforeCreateResponse(BaseModel):
    query: str
    matches_found: int
    recommended_action: str  # USE_EXISTING, REVIEW_REQUIRED, PROCEED_WITH_CREATION
    top_matches: List[SearchBeforeCreateMatch]

# Matching & Comparisons
class MatchReviewRequest(BaseModel):
    decision: str  # APPROVE, REJECT, MODIFY, NOT_EQUIVALENT, NEEDS_MORE_INFO
    override_reason: Optional[str] = None
    comments: Optional[str] = None
    proposed_cnmc_code: Optional[str] = None

class MatchResponse(BaseModel):
    id: int
    material_a: MaterialListItem
    material_b: MaterialListItem
    relationship_type: str
    ai_score: float
    text_score: float
    fuzzy_score: float
    attribute_score: float
    technical_compatibility_score: float
    adjusted_score: Optional[float] = None
    decision: str
    explanation: Dict[str, Any]
    matching_attributes: List[Dict[str, Any]]
    conflicting_attributes: List[Dict[str, Any]]
    missing_attributes: List[str]
    model_version: str
    configuration_version: str
    sector_rule_version: str
    created_at: datetime.datetime
    reviewed_at: Optional[datetime.datetime] = None
    reviewed_by: Optional[str] = None

# Conflict Schemas
class TechnicalConflictResponse(BaseModel):
    id: int
    match_id: Optional[int] = None
    material_a_code: str
    material_b_code: str
    cpse_a_code: str
    cpse_b_code: str
    conflict_field: str
    value_a: Optional[str] = None
    value_b: Optional[str] = None
    severity: str
    rule_name: str
    description: str
    review_status: str

# CNMC Catalog
class CommonMaterialResponse(BaseModel):
    id: int
    cnmc_code: str
    standardized_description: str
    category: str
    subcategory: Optional[str] = None
    material_family: Optional[str] = None
    grade: Optional[str] = None
    size_mm: Optional[float] = None
    schedule: Optional[str] = None
    standard: Optional[str] = None
    illustrative_gem_code: Optional[str] = None
    illustrative_unspsc_code: Optional[str] = None
    status: str
    mapped_count: int = 0
    mapped_materials: List[Dict[str, Any]] = []

# Audit Log
class AuditLogResponse(BaseModel):
    id: int
    sequence_num: int
    timestamp: datetime.datetime
    user_email: str
    user_role: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    reason: Optional[str] = None
    previous_value_json: Optional[str] = None
    new_value_json: Optional[str] = None
    previous_entry_hash: str
    entry_hash: str

class AuditVerificationResponse(BaseModel):
    is_valid: bool
    total_logs_checked: int
    verified_at: datetime.datetime
    first_hash: Optional[str] = None
    latest_hash: Optional[str] = None
    corrupted_entry_index: Optional[int] = None
    message: str

# Procurement Analytics
class ProcurementOpportunityResponse(BaseModel):
    id: int
    cnmc_code: Optional[str] = None
    title: str
    category: str
    participating_cpse_codes: List[str]
    total_quantity: float
    total_spend: float
    estimated_savings_lower: float
    estimated_savings_upper: float
    savings_percentage_est: float
    status: str
    description: Optional[str] = None

# Dashboard KPIs
class DashboardKPIResponse(BaseModel):
    total_materials: int
    exact_duplicates: int
    near_duplicates: int
    functional_equivalents: int
    technical_conflicts: int
    proposed_cnmcs: int
    connected_cpses: int
    average_data_quality: float
    procurement_opportunities: int
    pending_approvals: int
    total_spend_aggregated: float
    potential_savings_estimate: float
    materials_by_cpse: Dict[str, int]
    materials_by_category: Dict[str, int]
    quality_score_distribution: Dict[str, int]
    recent_activities: List[Dict[str, Any]]

# Technical Conflict Review Request
class ConflictReviewRequest(BaseModel):
    review_status: str  # RESOLVED, WAIVED, CONFIRMED
    override_reason: str
    reviewer: Optional[str] = "Technical Expert"

# Proposed Common Material Creation
class CommonMaterialCreate(BaseModel):
    standardized_description: str
    category: str
    subcategory: Optional[str] = None
    material_family: Optional[str] = None
    grade: Optional[str] = None
    size_mm: Optional[float] = None
    schedule: Optional[str] = None
    standard: Optional[str] = None
    illustrative_gem_code: Optional[str] = None
    illustrative_unspsc_code: Optional[str] = None

# Standardization Center Update Request
class StandardizeMaterialRequest(BaseModel):
    standardized_description: str
    final_approved_description: Optional[str] = None
    material_name: Optional[str] = None
    grade: Optional[str] = None
    size_raw: Optional[str] = None
    normalized_size_mm: Optional[float] = None
    schedule: Optional[str] = None
    pressure_rating: Optional[str] = None
    standard: Optional[str] = None
    reason: Optional[str] = "Expert standardization update"
    reviewer: Optional[str] = "Technical Expert"

# CPSE Mapping Response
class CPSEMappingResponse(BaseModel):
    id: int
    cnmc_id: int
    cnmc_code: str
    material_id: int
    material_code: str
    cpse_code: str
    cpse_name: str
    original_description: str
    mapping_type: str
    status: str
    effective_date: datetime.datetime

# Mock SAP / ERP Integration
class ERPExportRequest(BaseModel):
    target_system: Optional[str] = "SAP_S4HANA"
    cpse_code: Optional[str] = "CPCL"
    material_ids: Optional[List[int]] = None

