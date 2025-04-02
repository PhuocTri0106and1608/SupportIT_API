import { createMongoAbility, ForbiddenError, ForcedSubject, MongoAbility, RawRuleOf } from "@casl/ability";
import { ACTIONS, SUBJECTS } from "@common/constants";
import { CHECK_ABILITY, RequiredRule } from "@common/decorators";
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export type Abilities = [(typeof ACTIONS)[number], (typeof SUBJECTS)[number] | ForcedSubject<Exclude<(typeof SUBJECTS)[number], "all">>];
export type AppAbility = MongoAbility<Abilities>;

@Injectable()
export class AdminAbilitiesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    private createAbility = (rules: RawRuleOf<AppAbility>[]) => createMongoAbility<AppAbility>(rules);

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const rules = this.reflector.get<RequiredRule[]>(CHECK_ABILITY, context.getHandler()) || [];
        const currentAdmin = context.switchToHttp().getRequest().user;

        try {
            const ability = this.createAbility(Object(currentAdmin.permissions));

            for await (const rule of rules) {
                ForbiddenError.from(ability).setMessage("You are not allowed to perform this action").throwUnlessCan(rule.action, rule.subject);
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenError) {
                throw new ForbiddenException(error.message);
            }

            throw error;
        }
    }

    // private parseCondition(permissions: IAdminPermission[], currentUser: any) {
    //     return permissions.map((permission) => {
    //         if (permission.conditions && permission.conditions["created_by"]) {
    //             // Render conditions dynamically without Mustache
    //             const renderedValue = permission.conditions["created_by"].replace(/\{\{(.+?)\}\}/g, (_, key) => currentUser[key.trim()] || "");
    //             return {
    //                 ...permission,
    //                 conditions: { created_by: renderedValue }
    //             };
    //         }
    //         return permission;
    //     });
    // }
}
