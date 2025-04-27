export enum LoginTypeEnum {
    WEB2_GOOGLE_OAUTH2 = 0,
    WEB2_EMAIL_OTP = 1
}

export enum LoginStepEnum {
    REQUEST = "request",
    VERIFY = "verify"
}

export enum LoginProviderEnum {
    WEB2 = "web2"
}

export enum OAuthProvidersEnum {
    LOCAL = "local",
    GOOGLE = "google"
}

export enum TokenTypeEnum {
    ACCESS = "access",
    REFRESH = "refresh",
    ADMIN_ACCESS = "admin_access"
}

export enum LoginRoleEnum {
    CANDIDATE = "candidate",
    RECRUITER = "recruiter"
}
