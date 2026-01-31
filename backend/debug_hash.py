import sys
import traceback
from auth.jwt_handler import get_password_hash

try:
    print("Testing password hash...")
    hash = get_password_hash("test")
    print(f"Success: {hash}")
except Exception:
    with open("error_log.txt", "w") as f:
        traceback.print_exc(file=f)
    print("Error occurred, wrote to error_log.txt")
