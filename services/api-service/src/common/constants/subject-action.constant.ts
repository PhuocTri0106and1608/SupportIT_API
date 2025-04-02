import { AdminActionEnum, SubjectEnum } from "@common/enums";

export const SUBJECTS = [
    SubjectEnum.ALL,
    SubjectEnum.USERS,
    SubjectEnum.ADMINS,
    SubjectEnum.USER_REFS,
    SubjectEnum.QUESTS,
    SubjectEnum.ACHIEVEMENT,
    SubjectEnum.IMAGE,
    SubjectEnum.PUBLISHERS
];

export const ACTIONS = [AdminActionEnum.MANAGE, AdminActionEnum.CREATE, AdminActionEnum.READ, AdminActionEnum.UPDATE, AdminActionEnum.DELETE];
