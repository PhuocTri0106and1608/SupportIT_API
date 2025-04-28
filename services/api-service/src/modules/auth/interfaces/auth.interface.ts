import { LoginRoleEnum } from "@common/enums";

export interface IAuthPayload {
    id: string;
    email: string;
    sessionId: string;
    loginRole: LoginRoleEnum;
    roles?: LoginRoleEnum[];
    canBeRecruiter?: boolean;
}
