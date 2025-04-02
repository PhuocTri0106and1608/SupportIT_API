import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator<string>((prop: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request["user"];

    if (!user) {
        return null;
    }

    return prop ? user[prop] : user;
});
