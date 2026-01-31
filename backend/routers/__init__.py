from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.staff import router as staff_router
from routers.seats import router as seats_router
from routers.payments import router as payments_router
from routers.reports import router as reports_router

__all__ = [
    "auth_router",
    "users_router",
    "staff_router",
    "seats_router",
    "payments_router",
    "reports_router"
]
