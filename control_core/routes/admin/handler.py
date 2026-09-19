import os
from typing import Annotated
from fastapi import APIRouter, Header, HTTPException, status

async def verify_admin_password(
    # Header automatically maps 'X-Admin-Password' or 'x-admin-password'
    x_admin_password: Annotated[str | None, Header(alias="X-Admin-Password")] = None
):
    # Fetch the expected password from the environment
    expected_password = os.getenv("SERVER_ADMIN_PASSWORD")

    # If the environment variable isn't set, fail safely or handle as needed
    if not expected_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin system misconfiguration: SERVER_ADMIN_PASSWORD environment variable is missing."
        )

    # Verify the password matches
    if x_admin_password != expected_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Password header."
        )
