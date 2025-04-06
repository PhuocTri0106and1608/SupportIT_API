export interface IProvider {
    readonly clientID: string;
    readonly clientSecret: string;
    readonly callbackURI: string;
    readonly scope: string[];

    readonly authorizeHost: string;
    readonly authorizePath: string;
    readonly refreshPath?: string;
    readonly revokePath?: string;
}

export interface IGoogleUser {
    readonly sub: string;
    readonly name: string;
    readonly given_name: string;
    readonly family_name: string;
    readonly picture: string;
    readonly email: string;
    readonly email_verified: boolean;
    readonly locale: string;
    readonly hd: string;
}

export interface IUserExternalProfile {
    email: string;
    name: string;
    avatar: string;
    accessToken: string;
    refreshToken: string;
}
