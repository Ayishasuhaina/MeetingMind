# backend/app/models/__init__.py
# Importing all models here ensures SQLAlchemy's mapper registry
# is fully populated whenever this package is imported.
from app.models.meeting import Meeting          # noqa: F401
from app.models.action_item import ActionItem   # noqa: F401
from app.models.decision import Decision        # noqa: F401
from app.models.key_point import KeyPoint       # noqa: F401
from app.models.notification import Notification  # noqa: F401

__all__ = ["Meeting", "ActionItem", "Decision", "KeyPoint", "Notification"]
