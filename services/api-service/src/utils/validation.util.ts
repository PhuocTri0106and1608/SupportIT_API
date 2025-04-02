import { MESSAGE_CODES } from "@common/constants";
import { NotFoundException } from "@nestjs/common";

export const isUndefined = (value: unknown): value is undefined => typeof value === "undefined";

export const isNull = (value: unknown): value is null => value === null;

export function checkEntityExistence<T>(entity: T | null | undefined): void {
    if (isNull(entity) || isUndefined(entity)) {
        throw new NotFoundException(MESSAGE_CODES.NOT_FOUND);
    }
}
