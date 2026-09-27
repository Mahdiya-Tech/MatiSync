# MatiSync — AI Matching Pipeline & Technical Rule Engine

**Product:** MatiSync — AI-Powered Material Standardization & Harmonization Platform
**SIH 2026 Problem Statement:** 26099
**Ministry:** Ministry of Petroleum & Natural Gas
**Organization:** Chennai Petroleum Corporation Limited (CPCL)

---

## 1. Hybrid AI Matching Architecture

MatiSync does not rely solely on opaque black-box neural networks. Instead, it utilizes a multi-layered **Hybrid AI Matching Pipeline** that combines statistical natural language processing, fuzzy token matching, structured attribute matrices, and deterministic engineering safety rules.

```text
               RAW CPSE MATERIAL DESCRIPTION
                            │
                            ▼
              ┌───────────────────────────┐
              │    Data Quality Scorer    │ ─── Low Score Flag (<50%)
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │    Text Normalization     │ ─── Casing, Abbreviations, Units
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ NLP & Regex Extractor     │ ─── Grade, Dimensions, Schedule, Standard
              └─────────────┬─────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
┌──────────────────┐                  ┌──────────────────┐
│   Lexical & TF-  │                  │  RapidFuzz Token │
│   IDF Cosine Sim │                  │  Sort / Set Sim  │
└────────┬─────────┘                  └────────┬─────────┘
         │                                     │
         └──────────────────┬──────────────────┘
                            ▼
              ┌───────────────────────────┐
              │  Attribute Match Matrix   │ ─── Exact & Tolerance Comparison
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Technical Conflict Engine │ ─── Critical Physical Incompatibilities
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Composite Decision Engine │ ─── Configurable Sector Weights
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Active Learning Feedback  │ ─── Bayesian Prior Reranking
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │     Explainable AI        │ ─── Matching vs Conflicting Specs
              └───────────────────────────┘
```

---

## 2. Configurable Sector Weighting Profiles

MatiSync dynamically shifts matching importance weights depending on the industrial sector:

| Factor | Oil & Gas (Default) | Power | Steel | Mining | Heavy Engineering |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Text Similarity (TF-IDF)** | 35% | 30% | 35% | 40% | 35% |
| **Keyword / Fuzzy Ratio** | 15% | 15% | 15% | 15% | 15% |
| **Attribute Match Matrix** | 35% | 35% | 30% | 30% | 35% |
| **Technical Compatibility** | 15% | 20% | 20% | 15% | 15% |

### Key Sector Rules:
- **Oil & Gas:** Pipe schedule, ASME rating class, and NACE/ASTM corrosion standards receive dominant weighting.
- **Power:** Operating voltage (kV), thermal insulation class, and copper conductor core cross-sections receive dominant weighting.
- **Steel:** Yield strength, metallurgical composition, and mechanical toughness receive dominant weighting.

---

## 3. Engineering Tolerance Engine

MatiSync enforces real-world engineering conversion standards rather than string equality:

$$2\text{ inch} = 50.8\text{ mm} \neq 50.0\text{ mm}$$

Under **ASME B36.10M / IS 1239** nominal piping standards:
- 2 inch Nominal Pipe Size (NPS) corresponds to 50 mm Nominal Bore (NB).
- An item described as `2 INCH` and an item described as `50 MM` are evaluated as **Near-Equivalent under configured nominal piping tolerance**, and the exact rule is displayed to the user:
  > *"Engineering Conversion Rule Applied: 2 INCH (50.8 mm) vs 50 MM. Nominal 50 mm vs 2 inch are near-equivalent under configured nominal pipe size tolerance (ASME B36.10M). Original values preserved."*

---

## 4. Technical Conflict Safety Override (Critical Rule)

> **Core Rule:** A single critical physical conflict *must override* high lexical similarity.

### Conflict Evaluation Matrix:
1. **Piping Schedule Incompatibility:** `SCH40` vs `SCH80` $\rightarrow$ Wall thickness and pressure ratings differ significantly.
2. **Metallurgical Incompatibility:** `SS304` vs `SS316` $\rightarrow$ SS316 contains 2–3% Molybdenum for pitting corrosion resistance in acidic/marine refinery service.
3. **Pressure Containment Class:** `Class 150#` vs `Class 300#` $\rightarrow$ Bolt circle diameter and flange thicknesses differ.
4. **Voltage Rating:** `1.1 kV` vs `11 kV` $\rightarrow$ Dielectric insulation breakdown hazard.

When any critical conflict is detected:
- Technical Compatibility score drops to `25%`.
- Final relationship is forced to **`Technical Review Required`**.
- Automated merging is strictly locked until a human Technical Expert enters an override justification.

---

## 5. Transparent Active Learning Reranking

Rather than pretending to retrain a heavy deep neural network in real-time on a production server, MatiSync uses an auditable, transparent Bayesian feedback mechanism:

$$\text{Adjusted Score} = \text{AI Score} + \left( \frac{\text{Approved} - \text{Rejected}}{\text{Total Prior Feedback}} \times 5.0 \right)$$

This guarantees:
1. Complete transparency — experts see *why* the score was adjusted.
2. No silent model drift or black-box corruption.
3. Full traceability of which expert decisions influenced the ranking.
