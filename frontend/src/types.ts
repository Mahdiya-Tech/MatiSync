export type UserRole = 
  | 'Admin' 
  | 'CPSE Material Officer' 
  | 'Technical Expert' 
  | 'Procurement Officer' 
  | 'Management';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  cpse_code?: string;
  cpse_id?: number;
}

export interface CPSEOrg {
  id: number;
  code: string;
  name: string;
  sector: string;
  status: 'PILOT' | 'ACTIVE' | 'NOT_CONNECTED';
  contact_email?: string;
  last_upload?: string;
  material_count: number;
}

export interface MaterialListItem {
  id: number;
  cpse_code: string;
  cpse_name: string;
  material_code: string;
  original_description: string;
  normalized_description?: string;
  category: string;
  original_unit: string;
  material_name?: string;
  grade?: string;
  normalized_size_mm?: number;
  schedule?: string;
  data_quality_score: number;
  status: string;
  cnmc_code?: string;
}

export interface MaterialAttribute {
  id: number;
  attribute_name: string;
  attribute_value: string;
  raw_value?: string;
  confidence: number;
  extraction_method: string;
}

export interface MaterialVersion {
  id: number;
  version_num: number;
  changed_by: string;
  changed_at: string;
  change_type: string;
  field_changed: string;
  previous_value?: string;
  new_value?: string;
  reason?: string;
}

export interface MaterialDetail {
  id: number;
  cpse_id: number;
  cpse_code: string;
  cpse_name: string;
  material_code: string;
  original_description: string;
  normalized_description?: string;
  standardized_description?: string;
  final_approved_description?: string;
  category: string;
  subcategory?: string;
  original_unit: string;
  normalized_unit: string;
  material_name?: string;
  grade?: string;
  size_raw?: string;
  normalized_size_mm?: number;
  schedule?: string;
  pressure_rating?: string;
  temperature_rating?: string;
  standard?: string;
  specification?: string;
  manufacturer?: string;
  model?: string;
  part_number?: string;
  annual_quantity: number;
  annual_spend: number;
  currency: string;
  data_quality_score: number;
  quality_issues_count: number;
  quality_breakdown?: any;
  status: string;
  cnmc_id?: number;
  cnmc_code?: string;
  created_at: string;
  updated_at: string;
  attributes: MaterialAttribute[];
  versions: MaterialVersion[];
  mapped_cpse_codes: Array<{
    material_id: number;
    material_code: string;
    cpse_code: string;
    cpse_name: string;
    description: string;
    effective_date?: string;
  }>;
  matches?: Array<{
    id: number;
    other_material_id: number;
    other_material_code: string;
    other_cpse_code: string;
    other_description: string;
    relationship_type: string;
    ai_score: number;
    adjusted_score?: number;
    decision: string;
    explanation?: any;
    matching_attributes?: any[];
    conflicting_attributes?: any[];
  }>;
  conflicts?: Array<{
    id: number;
    conflict_field: string;
    value_a: string;
    value_b: string;
    severity: string;
    rule_name: string;
    description: string;
    review_status: string;
  }>;
  procurement_records?: Array<{
    id: number;
    po_number: string;
    fiscal_year: string;
    order_date?: string;
    unit_price: number;
    quantity: number;
    total_spend: number;
    delivery_location?: string;
    status: string;
    supplier_name: string;
  }>;
}

export interface MaterialMatch {
  id: number;
  material_a: MaterialListItem;
  material_b: MaterialListItem;
  relationship_type: string;
  ai_score: number;
  adjusted_score?: number;
  text_score: number;
  fuzzy_score?: number;
  attribute_score: number;
  technical_compatibility_score: number;
  decision: string;
  explanation: {
    summary: string;
    text_score?: number;
    attribute_score?: number;
    technical_compatibility_score?: number;
    active_learning_history?: { approved: number; rejected: number };
    weights_applied?: any;
  };
  matching_attributes: Array<{ attribute: string; value: string; match?: string; tolerance_rule?: string }>;
  conflicting_attributes: Array<{ attribute: string; value_a: string; value_b: string; severity?: string }>;
  missing_attributes: string[];
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface TechnicalConflict {
  id: number;
  match_id?: number;
  material_a_code: string;
  material_b_code: string;
  cpse_a_code: string;
  cpse_b_code: string;
  conflict_field: string;
  value_a?: string;
  value_b?: string;
  severity: string;
  rule_name: string;
  description: string;
  review_status: string;
}

export interface CommonMaterial {
  id: number;
  cnmc_code: string;
  standardized_description: string;
  category: string;
  subcategory?: string;
  material_family?: string;
  grade?: string;
  size_mm?: number;
  schedule?: string;
  standard?: string;
  illustrative_gem_code?: string;
  illustrative_unspsc_code?: string;
  status: string;
  mapped_count: number;
  mapped_materials: Array<{
    material_id: number;
    material_code: string;
    cpse_code: string;
    original_description: string;
  }>;
}

export interface ProcurementOpportunity {
  id: number;
  cnmc_code?: string;
  title: string;
  category: string;
  participating_cpse_codes: string[];
  total_quantity: number;
  total_spend: number;
  estimated_savings_lower: number;
  estimated_savings_upper: number;
  savings_percentage_est: number;
  status: string;
  description?: string;
}

export interface AuditLog {
  id: number;
  sequence_num: number;
  timestamp: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  reason?: string;
  previous_value_json?: string;
  new_value_json?: string;
  previous_entry_hash: string;
  entry_hash: string;
  current_hash?: string;
  previous_hash?: string;
}

export interface DashboardKPIs {
  total_materials: number;
  exact_duplicates: number;
  near_duplicates: number;
  functional_equivalents: number;
  technical_conflicts: number;
  proposed_cnmcs: number;
  connected_cpses: number;
  average_data_quality: number;
  procurement_opportunities: number;
  pending_approvals: number;
  total_spend_aggregated: number;
  potential_savings_estimate: number;
  materials_by_cpse: Record<string, number>;
  materials_by_category: Record<string, number>;
  quality_score_distribution: Record<string, number>;
  recent_activities: Array<{
    sequence: number;
    action: string;
    user: string;
    reason: string;
    timestamp: string;
  }>;
}

export interface SearchBeforeCreateMatch {
  material_id: number;
  material_code: string;
  cpse_code: string;
  description: string;
  cnmc_code?: string;
  similarity_score: number;
  relationship_type: string;
  status: string;
  has_conflict: boolean;
  conflict_summary?: string;
  matching_specs: string[];
  differing_specs: string[];
}

export interface SearchBeforeCreateResponse {
  query: string;
  matches_found: number;
  recommended_action: 'USE_EXISTING' | 'REVIEW_REQUIRED' | 'PROCEED_WITH_CREATION';
  top_matches: SearchBeforeCreateMatch[];
}
