import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base

class CPSEOrganization(Base):
    __tablename__ = "cpse_organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # CPCL, NTPC, SAIL, ONGC, IOCL, BPCL, BHEL, CIL
    name = Column(String(200), nullable=False)
    sector = Column(String(100), default="Oil & Gas")  # Oil & Gas, Power, Steel, Mining, Heavy Engineering
    status = Column(String(50), default="PILOT")  # PILOT, ACTIVE, NOT_CONNECTED
    contact_email = Column(String(100), nullable=True)
    last_upload = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    materials = relationship("Material", back_populates="cpse")
    users = relationship("User", back_populates="cpse")


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="CPSE Material Officer")  # Admin, CPSE Material Officer, Technical Expert, Procurement Officer, Management
    cpse_id = Column(Integer, ForeignKey("cpse_organizations.id"), nullable=True)
    full_name = Column(String(150), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    cpse = relationship("CPSEOrganization", back_populates="users")


class CommonNationalCode(Base):
    """
    Proposed Common National Material Code (CNMC).
    Uniqueness enforced deterministically & at DB level.
    """
    __tablename__ = "common_national_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    cnmc_code = Column(String(100), unique=True, index=True, nullable=False)  # NMC-PIP-SS-050-S40-001
    standardized_description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # Pipes, Valves, Electrical, Bearings, Pumps, Fasteners
    subcategory = Column(String(100), nullable=True)
    material_family = Column(String(100), nullable=True)  # Stainless Steel, Carbon Steel, Copper, etc.
    grade = Column(String(50), nullable=True)  # SS304, SS316, A106 Gr B, 8.8
    size_mm = Column(Float, nullable=True)  # Normalized metric diameter/size
    schedule = Column(String(50), nullable=True)  # SCH40, SCH80, PN16, 150#
    pressure_rating = Column(String(50), nullable=True)
    standard = Column(String(100), nullable=True)  # ASTM A312, IS 1239, DIN 2448
    illustrative_gem_code = Column(String(50), nullable=True)  # GeM-style mock code
    illustrative_unspsc_code = Column(String(50), nullable=True)  # UNSPSC-style mock code
    status = Column(String(50), default="APPROVED")  # APPROVED, PENDING_REVIEW, DEPRECATED
    created_by = Column(String(100), default="AI Standardization Engine")
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    materials = relationship("Material", back_populates="cnmc")
    mappings = relationship("CPSEMaterialMapping", back_populates="cnmc")


class Material(Base):
    """
    Material Master Record with complete 4-stage value preservation:
    Original -> Normalized -> Standardized -> Final Approved
    """
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    cpse_id = Column(Integer, ForeignKey("cpse_organizations.id"), nullable=False, index=True)
    material_code = Column(String(100), index=True, nullable=False)  # e.g. CPCL: CP-10452, NTPC: MAT-7821
    
    # 4-stage data transformation preservation
    original_description = Column(Text, nullable=False)
    normalized_description = Column(Text, nullable=True)
    standardized_description = Column(Text, nullable=True)
    final_approved_description = Column(Text, nullable=True)
    
    category = Column(String(100), default="General", index=True)
    subcategory = Column(String(100), nullable=True)
    
    # Unit normalization
    original_unit = Column(String(50), default="NOS")
    normalized_unit = Column(String(50), default="NOS")
    
    # Technical specs
    material_name = Column(String(100), nullable=True)  # Stainless Steel, Carbon Steel
    grade = Column(String(50), nullable=True)  # SS304, SS316, A106, XLPE
    size_raw = Column(String(100), nullable=True)  # 2 inch, 50 mm
    normalized_size_mm = Column(Float, nullable=True)  # 50.8, 50.0
    schedule = Column(String(50), nullable=True)  # SCH40, SCH80
    pressure_rating = Column(String(50), nullable=True)  # 150#, 300#, 16 bar
    temperature_rating = Column(String(50), nullable=True)
    standard = Column(String(100), nullable=True)  # ASTM A312, ASME B16.5
    specification = Column(Text, nullable=True)
    manufacturer = Column(String(150), nullable=True)
    model = Column(String(100), nullable=True)
    part_number = Column(String(100), nullable=True)
    
    # Procurement summary for demand aggregation
    annual_quantity = Column(Float, default=0.0)
    annual_spend = Column(Float, default=0.0)  # In INR
    currency = Column(String(10), default="INR")
    
    # Data Quality
    data_quality_score = Column(Float, default=100.0)
    quality_issues_count = Column(Integer, default=0)
    quality_breakdown_json = Column(Text, nullable=True)  # JSON string
    
    # Status
    # Active, Exact Duplicate, Near Duplicate, Functionally Equivalent, Candidate for Rationalization, Mapped, Deprecated, Under Review, Technical Conflict, Retain Separately
    status = Column(String(50), default="Active", index=True)
    
    # Foreign key to Proposed CNMC (if mapped)
    cnmc_id = Column(Integer, ForeignKey("common_national_codes.id"), nullable=True, index=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    cpse = relationship("CPSEOrganization", back_populates="materials")
    cnmc = relationship("CommonNationalCode", back_populates="materials")
    attributes = relationship("MaterialAttribute", back_populates="material", cascade="all, delete-orphan")
    normalizations = relationship("NormalizedMaterial", back_populates="material", cascade="all, delete-orphan")
    versions = relationship("MaterialVersion", back_populates="material", cascade="all, delete-orphan")
    procurement_records = relationship("ProcurementRecord", back_populates="material", cascade="all, delete-orphan")
    mappings = relationship("CPSEMaterialMapping", back_populates="material", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('cpse_id', 'material_code', name='_cpse_material_code_uc'),
    )


class MaterialAttribute(Base):
    __tablename__ = "material_attributes"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    attribute_name = Column(String(100), nullable=False)  # Material, Grade, Size, Schedule, Standard, Pressure, Voltage, etc.
    attribute_value = Column(String(200), nullable=False)
    raw_value = Column(String(200), nullable=True)
    confidence = Column(Float, default=1.0)
    extraction_method = Column(String(50), default="RULE_REGEX")  # REGEX, NLP_NER, DICTIONARY, RULE
    
    material = relationship("Material", back_populates="attributes")


class NormalizedMaterial(Base):
    """
    Detailed audit of field-by-field transformations
    """
    __tablename__ = "normalized_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    field_name = Column(String(50), nullable=False)  # description, unit, size, grade, etc.
    original_value = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    standardized_value = Column(Text, nullable=True)
    rule_applied = Column(String(200), nullable=True)
    transformation_notes = Column(Text, nullable=True)
    
    material = relationship("Material", back_populates="normalizations")


class MaterialVersion(Base):
    """
    Traceable version history for any edit or re-classification
    """
    __tablename__ = "material_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    version_num = Column(Integer, nullable=False, default=1)
    changed_by = Column(String(100), nullable=False)
    changed_at = Column(DateTime, default=datetime.datetime.utcnow)
    change_type = Column(String(50), default="UPDATE")  # CREATED, NORMALIZED, STANDARDIZED, APPROVED, OVERRIDDEN, RATIONALIZED
    field_changed = Column(String(100), nullable=False)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    
    material = relationship("Material", back_populates="versions")


class MaterialMatch(Base):
    """
    Stores pairwise comparisons, AI scores, conflict alerts, and review state
    """
    __tablename__ = "material_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    material_a_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    material_b_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    
    # Relationship Type: Exact Duplicate, Near Duplicate, Functionally Equivalent, Potential Match, Not Equivalent, Technical Review Required
    relationship_type = Column(String(50), nullable=False, index=True)
    
    # Granular scores
    ai_score = Column(Float, nullable=False)  # 0.0 - 100.0
    text_score = Column(Float, default=0.0)
    fuzzy_score = Column(Float, default=0.0)
    attribute_score = Column(Float, default=0.0)
    technical_compatibility_score = Column(Float, default=100.0)
    adjusted_score = Column(Float, nullable=True)  # Active learning score
    
    # Decision: PENDING, APPROVED, REJECTED, MODIFIED, NOT_EQUIVALENT, NEEDS_INFO
    decision = Column(String(50), default="PENDING", index=True)
    
    explanation_json = Column(Text, nullable=True)
    matching_attributes_json = Column(Text, nullable=True)
    conflicting_attributes_json = Column(Text, nullable=True)
    missing_attributes_json = Column(Text, nullable=True)
    
    model_version = Column(String(50), default="matisync-hybrid-v1.4")
    configuration_version = Column(String(50), default="MATISYNC-CONFIG-2026.01")
    sector_rule_version = Column(String(50), default="RULE-OILGAS-REV4")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(100), nullable=True)

    conflicts = relationship("TechnicalConflict", back_populates="match", cascade="all, delete-orphan")
    feedback = relationship("MatchFeedback", back_populates="match", cascade="all, delete-orphan")


class TechnicalConflict(Base):
    """
    Technical conflicts override text similarity score
    """
    __tablename__ = "technical_conflicts"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("material_matches.id"), nullable=True, index=True)
    material_a_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    material_b_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    
    conflict_field = Column(String(100), nullable=False)  # schedule, grade, pressure, voltage, standard, etc.
    value_a = Column(String(200), nullable=True)
    value_b = Column(String(200), nullable=True)
    severity = Column(String(20), default="CRITICAL")  # CRITICAL, WARNING
    rule_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    review_status = Column(String(50), default="PENDING")  # PENDING, OVERRIDDEN, CONFIRMED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    match = relationship("MaterialMatch", back_populates="conflicts")


class MatchFeedback(Base):
    """
    Active Learning: transparent human feedback storing past expert decisions
    """
    __tablename__ = "match_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("material_matches.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_ai_score = Column(Float, nullable=False)
    adjusted_score = Column(Float, nullable=False)
    feedback_type = Column(String(50), nullable=False)  # APPROVED_MATCH, REJECTED_MATCH, MARKED_CONFLICT, CORRECTED_ATTR
    decision = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    match = relationship("MaterialMatch", back_populates="feedback")


class CPSEMaterialMapping(Base):
    """
    Proposed CNMC mapping to original CPSE codes
    """
    __tablename__ = "cpse_material_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    cnmc_id = Column(Integer, ForeignKey("common_national_codes.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    cpse_id = Column(Integer, ForeignKey("cpse_organizations.id"), nullable=False)
    mapping_type = Column(String(50), default="ONE_TO_ONE")  # ONE_TO_ONE, MANY_TO_ONE
    status = Column(String(50), default="ACTIVE")  # ACTIVE, PENDING, ARCHIVED
    effective_date = Column(DateTime, default=datetime.datetime.utcnow)
    reviewer_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    cnmc = relationship("CommonNationalCode", back_populates="mappings")
    material = relationship("Material", back_populates="mappings")


class LegacyMaterialCode(Base):
    __tablename__ = "legacy_material_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    cpse_id = Column(Integer, ForeignKey("cpse_organizations.id"), nullable=False)
    original_code = Column(String(100), nullable=False)
    proposed_status = Column(String(50), default="Active")  # Active, Duplicate, Near Duplicate, Functionally Equivalent, Mapped, Deprecated, Under Review, Technical Conflict, Retain Separately
    rationalization_action = Column(String(50), default="Review")  # Retain, Map, Rationalize, Review, Deprecate
    action_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    contact_email = Column(String(100), nullable=True)
    rating = Column(Float, default=4.5)
    country = Column(String(50), default="India")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ProcurementRecord(Base):
    __tablename__ = "procurement_records"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    cpse_id = Column(Integer, ForeignKey("cpse_organizations.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    fiscal_year = Column(String(20), default="FY 2025-26")
    po_number = Column(String(100), nullable=False)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    total_spend = Column(Float, nullable=False)
    delivery_location = Column(String(150), nullable=True)
    status = Column(String(50), default="COMPLETED")
    
    material = relationship("Material", back_populates="procurement_records")


class ProcurementOpportunity(Base):
    __tablename__ = "procurement_opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    cnmc_id = Column(Integer, ForeignKey("common_national_codes.id"), nullable=True)
    title = Column(String(250), nullable=False)
    category = Column(String(100), nullable=False)
    participating_cpse_codes_json = Column(Text, nullable=False)  # ["CPCL", "NTPC", "ONGC"]
    total_quantity = Column(Float, default=0.0)
    total_spend = Column(Float, default=0.0)
    estimated_savings_lower = Column(Float, default=0.0)
    estimated_savings_upper = Column(Float, default=0.0)
    savings_percentage_est = Column(Float, default=8.5)
    status = Column(String(50), default="Identified")  # Identified, Under Review, Planned, Consolidated
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    cnmc = relationship("CommonNationalCode")


class DataQualityResult(Base):
    __tablename__ = "data_quality_results"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    overall_score = Column(Float, nullable=False)
    missing_fields_json = Column(Text, nullable=True)
    inconsistent_fields_json = Column(Text, nullable=True)
    formatting_issues_json = Column(Text, nullable=True)
    recommendations_json = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.datetime.utcnow)


class ReviewDecision(Base):
    __tablename__ = "review_decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("material_matches.id"), nullable=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewer_role = Column(String(50), nullable=False)
    previous_recommendation = Column(String(100), nullable=True)
    decision = Column(String(50), nullable=False)  # APPROVE, REJECT, MODIFY, NOT_EQUIVALENT, NEEDS_MORE_INFO
    override_reason = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    """
    Tamper-Evident SHA-256 Hash Chain
    entry_hash = SHA256(previous_entry_hash + timestamp + user + action + entity + payload)
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    sequence_num = Column(Integer, unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    user_email = Column(String(150), nullable=False)
    user_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)  # LOGIN, UPLOAD, NORMALIZE, MATCH, APPROVE, OVERRIDE, RATIONALIZE, CNMC_GENERATE, EXPORT
    entity_type = Column(String(50), nullable=False)  # MATERIAL, MATCH, CNMC, MAPPING, AUDIT, SETTINGS
    entity_id = Column(String(100), nullable=True)
    previous_value_json = Column(Text, nullable=True)
    new_value_json = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    
    previous_entry_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), unique=True, nullable=False)


class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
