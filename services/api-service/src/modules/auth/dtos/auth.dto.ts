import { IUserExternalProfile } from "@modules/google/interfaces";

export class UserExternalProfileDto implements IUserExternalProfile {
    email: string;
    name: string;
    avatar: string;
    accessToken: string;
    refreshToken: string;
}
