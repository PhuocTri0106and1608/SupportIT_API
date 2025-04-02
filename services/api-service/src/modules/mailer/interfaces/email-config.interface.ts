interface IEmailAuth {
    user: string;
    pass: string;
}

export interface IEmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: IEmailAuth;
}

export interface IUseEmailInfo {
    email: string;
}
