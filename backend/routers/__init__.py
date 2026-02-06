from routers.chits import router as chits_router
from routers.users import router as users_router
from routers.auth import router as auth_router
from routers.staff import router as staff_router
from routers.payments import router as payments_router
from routers.reports import router as reports_router
from routers.accounts import router as accounts_router
from routers.pamphlet import router as pamphlet_router

__all__ = [
    "chits_router",
    "users_router",
    "auth_router",
    "staff_router",
    "payments_router",
    "reports_router",
    "accounts_router",
    "pamphlet_router",
]

