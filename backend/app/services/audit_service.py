import hashlib
import json
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import AuditLog

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def calculate_entry_hash(
    previous_hash: str,
    sequence_num: int,
    timestamp_iso: str,
    user_email: str,
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    payload_str: str
) -> str:
    """
    Computes cryptographic SHA-256 hash across previous hash + entry fields
    """
    data = f"{previous_hash}|{sequence_num}|{timestamp_iso}|{user_email}|{action}|{entity_type}|{entity_id or ''}|{payload_str}"
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

def record_audit_log(
    db: Session,
    user_email: str,
    user_role: str,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    previous_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None
) -> AuditLog:
    """
    Appends a new immutable tamper-evident log entry to the hash chain.
    """
    last_log = db.query(AuditLog).order_by(AuditLog.sequence_num.desc()).first()
    
    if last_log:
        sequence_num = last_log.sequence_num + 1
        previous_hash = last_log.entry_hash
    else:
        sequence_num = 1
        previous_hash = GENESIS_HASH

    now = datetime.datetime.utcnow()
    timestamp_iso = now.isoformat()
    
    prev_str = json.dumps(previous_value, sort_keys=True) if previous_value else ""
    new_str = json.dumps(new_value, sort_keys=True) if new_value else ""
    payload_combined = f"{prev_str}:{new_str}:{reason or ''}"
    
    entry_hash = calculate_entry_hash(
        previous_hash=previous_hash,
        sequence_num=sequence_num,
        timestamp_iso=timestamp_iso,
        user_email=user_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        payload_str=payload_combined
    )

    log_entry = AuditLog(
        sequence_num=sequence_num,
        timestamp=now,
        user_email=user_email,
        user_role=user_role,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        previous_value_json=prev_str if prev_str else None,
        new_value_json=new_str if new_str else None,
        reason=reason,
        previous_entry_hash=previous_hash,
        entry_hash=entry_hash
    )
    
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

def verify_audit_trail_integrity(db: Session) -> Dict[str, Any]:
    """
    Validates the entire stored SHA-256 hash chain link-by-link from genesis block to current head.
    Detects if any stored record has been modified in the database.
    """
    logs = db.query(AuditLog).order_by(AuditLog.sequence_num.asc()).all()
    
    if not logs:
        return {
            "is_valid": True,
            "total_logs_checked": 0,
            "verified_at": datetime.datetime.utcnow(),
            "first_hash": None,
            "latest_hash": None,
            "corrupted_entry_index": None,
            "message": "Audit trail is empty. Ready for logging."
        }

    expected_prev_hash = GENESIS_HASH
    
    for idx, log in enumerate(logs):
        # 1. Verify previous hash pointer
        if log.previous_entry_hash != expected_prev_hash:
            return {
                "is_valid": False,
                "total_logs_checked": len(logs),
                "verified_at": datetime.datetime.utcnow(),
                "first_hash": logs[0].entry_hash,
                "latest_hash": logs[-1].entry_hash,
                "corrupted_entry_index": log.sequence_num,
                "message": f"INTEGRITY CHECK FAILED: Hash chain broken at sequence #{log.sequence_num}. Previous hash pointer does not match preceding record's cryptographic hash."
            }

        # 2. Recalculate entry hash
        timestamp_iso = log.timestamp.isoformat()
        prev_str = log.previous_value_json or ""
        new_str = log.new_value_json or ""
        payload_combined = f"{prev_str}:{new_str}:{log.reason or ''}"
        
        recomputed_hash = calculate_entry_hash(
            previous_hash=log.previous_entry_hash,
            sequence_num=log.sequence_num,
            timestamp_iso=timestamp_iso,
            user_email=log.user_email,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            payload_str=payload_combined
        )

        if recomputed_hash != log.entry_hash:
            return {
                "is_valid": False,
                "total_logs_checked": len(logs),
                "verified_at": datetime.datetime.utcnow(),
                "first_hash": logs[0].entry_hash,
                "latest_hash": logs[-1].entry_hash,
                "corrupted_entry_index": log.sequence_num,
                "message": f"INTEGRITY CHECK FAILED: Unauthorized modification detected in entry #{log.sequence_num}. Payload or metadata has been altered after signing."
            }

        expected_prev_hash = log.entry_hash

    return {
        "is_valid": True,
        "total_logs_checked": len(logs),
        "verified_at": datetime.datetime.utcnow(),
        "first_hash": logs[0].entry_hash,
        "latest_hash": logs[-1].entry_hash,
        "corrupted_entry_index": None,
        "message": f"Audit trail verified successfully. All {len(logs)} cryptographic links in the SHA-256 hash chain are intact and authentic."
    }

def simulate_demo_tamper(db: Session) -> Dict[str, Any]:
    """
    Demo-only tamper simulator: Alters an audit log record in memory/DB to show the verifier flagging it.
    """
    target = db.query(AuditLog).filter(AuditLog.sequence_num == 2).first()
    if not target:
        target = db.query(AuditLog).order_by(AuditLog.sequence_num.asc()).first()
    
    if target and not (target.reason or "").startswith("[TAMPERED] "):
        target.reason = "[TAMPERED] " + (target.reason or "")
        db.commit()
        return {"tampered_sequence": target.sequence_num, "status": "TAMPER_SIMULATED"}
    return {"status": "ALREADY_TAMPERED" if target else "NO_LOGS_AVAILABLE"}

def restore_demo_tamper(db: Session) -> Dict[str, Any]:
    """
    Restores the tampered record by removing the unauthorized tamper prefix,
    returning the record to its authentic state signed by its entry_hash.
    """
    targets = db.query(AuditLog).filter(AuditLog.reason.like("[TAMPERED] %")).all()
    for target in targets:
        target.reason = target.reason.replace("[TAMPERED] ", "", 1)
        
    legacy = db.query(AuditLog).filter(AuditLog.reason.like("%TAMPERED DEMO VALUE%")).all()
    for l in legacy:
        l.reason = "Registered 8 CPSE organizations with pilot configurations"
        timestamp_iso = l.timestamp.isoformat()
        payload = f"::{l.reason}"
        l.entry_hash = calculate_entry_hash(
            l.previous_entry_hash,
            l.sequence_num,
            timestamp_iso,
            l.user_email,
            l.action,
            l.entity_type,
            l.entity_id,
            payload
        )
    db.commit()
    return {"restored_sequence": targets[0].sequence_num if targets else 2, "status": "RESTORED"}
