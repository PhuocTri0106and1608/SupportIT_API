import { AdminActionEnum, SubjectEnum } from "@common/enums";
import { SetMetadata } from "@nestjs/common";

export const CHECK_ABILITY = "check_ability";

export interface RequiredRule {
    action: AdminActionEnum;
    subject: SubjectEnum;
}

export const CheckAbilites = (...requirements: RequiredRule[]) => SetMetadata(CHECK_ABILITY, requirements);
