import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value: any, { metatype }: ArgumentMetadata) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToInstance(metatype, value);
        const errors = await validate(object);

        if (errors.length > 0) {
            throw new BadRequestException(`${this.formatErrors(errors)}`);
        }

        return value;
    }

    private toValidate(metatype: any): boolean {
        const types: any[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }

    private formatErrors(errors: any[]): string {
        return errors.map((err) => {
            let error: string = "";

            error = err.constraints ? Object.values(err.constraints).join(", ") : "";

            if (err.children.length) {
                error += this.formatErrors(err.children);
            }

            return error;
        })[0];
    }
}
