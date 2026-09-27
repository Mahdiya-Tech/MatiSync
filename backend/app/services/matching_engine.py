import math
from typing import Dict, Any, List, Tuple
from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .normalizer import normalize_text, evaluate_size_tolerance
from .conflict_detector import detect_technical_conflicts
from ..config import settings

# Sector-specific weighting profiles
SECTOR_WEIGHTS: Dict[str, Dict[str, float]] = {
    "oil_and_gas": {
        "text_weight": 0.35,
        "fuzzy_weight": 0.15,
        "attribute_weight": 0.35,  # Heavy weight on schedule, pressure, ASTM specs
        "technical_weight": 0.15
    },
    "power": {
        "text_weight": 0.30,
        "fuzzy_weight": 0.15,
        "attribute_weight": 0.35,  # Heavy weight on voltage, thermal ratings
        "technical_weight": 0.20
    },
    "steel": {
        "text_weight": 0.35,
        "fuzzy_weight": 0.15,
        "attribute_weight": 0.30,
        "technical_weight": 0.20
    },
    "mining": {
        "text_weight": 0.40,
        "fuzzy_weight": 0.15,
        "attribute_weight": 0.30,
        "technical_weight": 0.15
    },
    "heavy_engineering": {
        "text_weight": 0.35,
        "fuzzy_weight": 0.15,
        "attribute_weight": 0.35,
        "technical_weight": 0.15
    }
}

class HybridMatchingEngine:
    def __init__(self, sector: str = "oil_and_gas"):
        self.sector = sector if sector in SECTOR_WEIGHTS else "oil_and_gas"
        self.weights = SECTOR_WEIGHTS[self.sector]
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", lowercase=True)

    def calculate_text_similarity(self, text_a: str, text_b: str) -> float:
        """Computes TF-IDF cosine similarity between normalized strings"""
        if not text_a or not text_b:
            return 0.0
        norm_a = normalize_text(text_a)
        norm_b = normalize_text(text_b)
        if norm_a == norm_b:
            return 100.0
            
        try:
            tfidf_matrix = self.vectorizer.fit_transform([norm_a, norm_b])
            cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return round(float(cos_sim) * 100.0, 2)
        except Exception:
            return round(float(fuzz.ratio(norm_a, norm_b)), 2)

    def calculate_fuzzy_similarity(self, text_a: str, text_b: str) -> float:
        """Computes token sort and token set ratio"""
        norm_a = normalize_text(text_a)
        norm_b = normalize_text(text_b)
        sort_ratio = fuzz.token_sort_ratio(norm_a, norm_b)
        set_ratio = fuzz.token_set_ratio(norm_a, norm_b)
        return round(float((sort_ratio * 0.4) + (set_ratio * 0.6)), 2)

    def calculate_attribute_matrix(self, mat_a: Dict[str, Any], mat_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates granular attribute-level match score (0-100) and returns
        matching attributes, conflicting attributes, and missing attributes.
        """
        score = 0.0
        total_weight = 0.0
        
        matching = []
        conflicting = []
        missing = []

        # 1. Base Material (Weight: 25)
        w_mat = 25.0
        total_weight += w_mat
        m_a = (mat_a.get("material_name") or "").upper().strip()
        m_b = (mat_b.get("material_name") or "").upper().strip()
        if m_a and m_b:
            if m_a == m_b:
                score += w_mat
                matching.append({"attribute": "Base Material", "value": m_a, "match": "EXACT"})
            else:
                conflicting.append({"attribute": "Base Material", "value_a": m_a, "value_b": m_b})
        else:
            missing.append("Base Material" if not m_a and not m_b else ("Base Material (in A)" if not m_a else "Base Material (in B)"))

        # 2. Grade (Weight: 25)
        w_grd = 25.0
        total_weight += w_grd
        g_a = (mat_a.get("grade") or "").upper().strip()
        g_b = (mat_b.get("grade") or "").upper().strip()
        if g_a and g_b:
            if g_a == g_b:
                score += w_grd
                matching.append({"attribute": "Metallurgical Grade", "value": g_a, "match": "EXACT"})
            else:
                conflicting.append({"attribute": "Metallurgical Grade", "value_a": g_a, "value_b": g_b})
        else:
            missing.append("Grade")

        # 3. Size / Dimension (Weight: 20)
        w_size = 20.0
        total_weight += w_size
        s_a = mat_a.get("size_raw")
        s_b = mat_b.get("size_raw")
        if s_a and s_b:
            size_eval = evaluate_size_tolerance(s_a, s_b)
            if size_eval["is_exact_equal"]:
                score += w_size
                matching.append({"attribute": "Nominal Size", "value": s_a, "match": "EXACT"})
            elif size_eval["is_near_equivalent"]:
                score += (w_size * 0.95)
                matching.append({
                    "attribute": "Nominal Size",
                    "value": f"{s_a} vs {s_b}",
                    "match": "ENGINEERING_TOLERANCE",
                    "tolerance_rule": size_eval["tolerance_rule_used"]
                })
            else:
                conflicting.append({"attribute": "Nominal Size", "value_a": str(s_a), "value_b": str(s_b)})
        else:
            missing.append("Size")

        # 4. Schedule or Pressure Rating (Weight: 15)
        w_spec = 15.0
        total_weight += w_spec
        sch_a = (mat_a.get("schedule") or "").upper().strip()
        sch_b = (mat_b.get("schedule") or "").upper().strip()
        press_a = (mat_a.get("pressure_rating") or "").upper().strip()
        press_b = (mat_b.get("pressure_rating") or "").upper().strip()

        if sch_a and sch_b:
            if sch_a == sch_b:
                score += w_spec
                matching.append({"attribute": "Schedule", "value": sch_a, "match": "EXACT"})
            else:
                conflicting.append({"attribute": "Schedule", "value_a": sch_a, "value_b": sch_b})
        elif press_a and press_b:
            if press_a == press_b:
                score += w_spec
                matching.append({"attribute": "Pressure Rating", "value": press_a, "match": "EXACT"})
            else:
                conflicting.append({"attribute": "Pressure Rating", "value_a": press_a, "value_b": press_b})
        else:
            missing.append("Schedule / Pressure Class")

        # 5. Standard (Weight: 15)
        w_std = 15.0
        total_weight += w_std
        std_a = (mat_a.get("standard") or "").upper().strip()
        std_b = (mat_b.get("standard") or "").upper().strip()
        if std_a and std_b:
            if std_a == std_b:
                score += w_std
                matching.append({"attribute": "Standard", "value": std_a, "match": "EXACT"})
            else:
                conflicting.append({"attribute": "Standard", "value_a": std_a, "value_b": std_b})
        else:
            missing.append("Standard")

        attr_score = round((score / total_weight) * 100.0, 2) if total_weight > 0 else 0.0
        return {
            "attribute_score": attr_score,
            "matching_attributes": matching,
            "conflicting_attributes": conflicting,
            "missing_attributes": missing
        }

    def compare_materials(
        self,
        mat_a: Dict[str, Any],
        mat_b: Dict[str, Any],
        feedback_history: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end hybrid matching:
        1. Text TF-IDF score
        2. Fuzzy score
        3. Attribute match matrix score
        4. Technical conflict detection
        5. Composite AI score calculation
        6. Technical conflict safety override
        7. Active learning feedback reranking
        8. Explainable AI breakdown
        """
        desc_a = mat_a.get("original_description") or ""
        desc_b = mat_b.get("original_description") or ""

        # 1 & 2. Text and Fuzzy similarities
        text_score = self.calculate_text_similarity(desc_a, desc_b)
        fuzzy_score = self.calculate_fuzzy_similarity(desc_a, desc_b)

        # 3. Attribute matrix
        attr_result = self.calculate_attribute_matrix(mat_a, mat_b)
        attribute_score = attr_result["attribute_score"]

        # 4. Conflict detection
        conflict_eval = detect_technical_conflicts(mat_a, mat_b, self.sector)
        has_critical = conflict_eval["has_critical_conflict"]

        # Technical compatibility score
        if has_critical:
            tech_compat_score = 25.0
        elif conflict_eval["has_conflicts"]:
            tech_compat_score = 65.0
        else:
            tech_compat_score = 100.0

        # 5. Composite AI Score
        raw_ai_score = (
            (text_score * self.weights["text_weight"]) +
            (fuzzy_score * self.weights["fuzzy_weight"]) +
            (attribute_score * self.weights["attribute_weight"]) +
            (tech_compat_score * self.weights["technical_weight"])
        )
        ai_score = round(max(0.0, min(100.0, raw_ai_score)), 1)

        # 6. Safety Override & Relationship determination
        if has_critical:
            relationship_type = "Technical Review Required"
            decision_status = "PENDING"
            explanation_summary = f"CRITICAL TECHNICAL CONFLICT OVERRIDE: While text similarity is {text_score:.1f}%, a critical physical conflict was detected in {', '.join([c['conflict_field'] for c in conflict_eval['conflicts']])}. High similarity does NOT equal technical interchangeability. Sent for mandatory human expert review."
        elif ai_score >= 95.0 and attribute_score >= 90.0:
            relationship_type = "Exact Duplicate"
            decision_status = "PENDING"
            explanation_summary = f"Identical specifications and metallurgy confirmed across both CPSE material records with {ai_score:.1f}% confidence."
        elif ai_score >= 88.0:
            relationship_type = "Near Duplicate"
            decision_status = "PENDING"
            explanation_summary = f"Near-duplicate records with compatible dimensions ({ai_score:.1f}% similarity). Engineering tolerances verified."
        elif ai_score >= 75.0:
            relationship_type = "Functionally Equivalent"
            decision_status = "PENDING"
            explanation_summary = f"Functionally equivalent application with compatible grade/schedule specifications ({ai_score:.1f}% match)."
        elif ai_score >= 50.0:
            relationship_type = "Potential Match"
            decision_status = "PENDING"
            explanation_summary = f"Partial attribute overlap found ({ai_score:.1f}%). Requires verification of missing attributes."
        else:
            relationship_type = "Not Equivalent"
            decision_status = "NOT_EQUIVALENT"
            explanation_summary = f"Low similarity ({ai_score:.1f}%). Material characteristics differ substantially."

        # 7. Active Learning Feedback Adjustment
        adjusted_score = ai_score
        similar_decisions = {"approved": 0, "rejected": 0}
        if feedback_history:
            for fb in feedback_history:
                if fb.get("decision") == "APPROVE":
                    similar_decisions["approved"] += 1
                elif fb.get("decision") in ["REJECT", "NOT_EQUIVALENT"]:
                    similar_decisions["rejected"] += 1
                    
            total_fb = similar_decisions["approved"] + similar_decisions["rejected"]
            if total_fb > 0:
                # Transparent Bayesian adjustment
                ratio = (similar_decisions["approved"] - similar_decisions["rejected"]) / total_fb
                # Adjust up to +/- 5%
                adjusted_score = round(max(0.0, min(100.0, ai_score + (ratio * 5.0))), 1)

        explanation = {
            "summary": explanation_summary,
            "text_score": text_score,
            "fuzzy_score": fuzzy_score,
            "attribute_score": attribute_score,
            "technical_compatibility_score": tech_compat_score,
            "active_learning_history": similar_decisions,
            "weights_applied": self.weights,
            "sector": self.sector
        }

        return {
            "relationship_type": relationship_type,
            "ai_score": ai_score,
            "adjusted_score": adjusted_score if adjusted_score != ai_score else None,
            "text_score": text_score,
            "fuzzy_score": fuzzy_score,
            "attribute_score": attribute_score,
            "technical_compatibility_score": tech_compat_score,
            "decision": decision_status,
            "explanation": explanation,
            "matching_attributes": attr_result["matching_attributes"],
            "conflicting_attributes": attr_result["conflicting_attributes"],
            "missing_attributes": attr_result["missing_attributes"],
            "conflicts": conflict_eval["conflicts"],
            "has_critical_conflict": has_critical,
            "model_version": settings.AI_MODEL_VERSION,
            "configuration_version": settings.CONFIG_VERSION,
            "sector_rule_version": settings.SECTOR_RULE_VERSION
        }
