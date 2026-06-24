from rest_framework.throttling import UserRateThrottle

class LoginRateThrottle(UserRateThrottle):
    scope = 'auth_login'

class RefreshRateThrottle(UserRateThrottle):
    scope = 'auth_refresh'

class PasswordChangeRateThrottle(UserRateThrottle):
    scope = 'auth_password_change'

