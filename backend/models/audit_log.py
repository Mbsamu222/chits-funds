"""
Audit Log Model
Tracks all CRUD operations for accountability and compliance.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum
import json


class AuditAction(str, enum.Enum):
    """Types of auditable actions"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_RESET = "password_reset"
    PASSWORD_CHANGE = "password_change"


class AuditLog(Base):
    """
    Audit Log - Records all significant actions in the system.
    
    Tracks:
    - Who performed the action (staff_id)
    - What action was taken (create/update/delete)
    - Which entity was affected (user, chit, payment, etc.)
    - Before and after state (JSON snapshots)
    - When it happened
    - From where (IP address)
    
    Usage:
    - Call log_action() after every CRUD operation
    - Never delete audit logs
    - Use for internal accountability
    - Required for financial compliance
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who performed the action
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True, index=True)
    staff_name = Column(String(100), nullable=True)  # Denormalized for quick access
    
    # What action
    action = Column(SQLEnum(AuditAction), nullable=False, index=True)
    
    # Which entity
    entity_type = Column(String(50), nullable=False, index=True)  # user, chit, payment, staff, etc.
    entity_id = Column(Integer, nullable=True, index=True)
    entity_name = Column(String(255), nullable=True)  # Human-readable identifier
    
    # State snapshots (JSON)
    before_data = Column(Text, nullable=True)  # State before change
    after_data = Column(Text, nullable=True)   # State after change
    
    # Additional context
    description = Column(Text, nullable=True)  # Human-readable description
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    staff = relationship("Staff", backref="audit_logs")
    
    @staticmethod
    def create_log(
        db,
        staff_id: int,
        staff_name: str,
        action: AuditAction,
        entity_type: str,
        entity_id: int = None,
        entity_name: str = None,
        before_data: dict = None,
        after_data: dict = None,
        description: str = None,
        ip_address: str = None,
        user_agent: str = None
    ):
        """Create and save an audit log entry"""
        log = AuditLog(
            staff_id=staff_id,
            staff_name=staff_name,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            before_data=json.dumps(before_data) if before_data else None,
            after_data=json.dumps(after_data) if after_data else None,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        db.commit()
        return log
    
    def get_before_dict(self) -> dict:
        """Parse before_data JSON"""
        if self.before_data:
            return json.loads(self.before_data)
        return {}
    
    def get_after_dict(self) -> dict:
        """Parse after_data JSON"""
        if self.after_data:
            return json.loads(self.after_data)
        return {}
    
    def get_changes(self) -> dict:
        """Get dictionary of changed fields"""
        before = self.get_before_dict()
        after = self.get_after_dict()
        
        changes = {}
        all_keys = set(before.keys()) | set(after.keys())
        
        for key in all_keys:
            old_val = before.get(key)
            new_val = after.get(key)
            if old_val != new_val:
                changes[key] = {"old": old_val, "new": new_val}
        
        return changes
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, entity={self.entity_type}:{self.entity_id})>"
