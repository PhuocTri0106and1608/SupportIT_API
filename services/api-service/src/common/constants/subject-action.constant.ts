import { AdminActionEnum, SubjectEnum } from "@common/enums";

export const SUBJECTS = [
    SubjectEnum.ALL,
    SubjectEnum.CANDIDATES,
    SubjectEnum.ADMINS,
    SubjectEnum.IMAGE,
    SubjectEnum.RECRUITERS
];

export const ACTIONS = [AdminActionEnum.MANAGE, AdminActionEnum.CREATE, AdminActionEnum.READ, AdminActionEnum.UPDATE, AdminActionEnum.DELETE];
