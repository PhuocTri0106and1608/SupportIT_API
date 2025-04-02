export class InternalResponseType<T = any> {
    result: boolean;
    data?: T | null;
    error?: any;
}
