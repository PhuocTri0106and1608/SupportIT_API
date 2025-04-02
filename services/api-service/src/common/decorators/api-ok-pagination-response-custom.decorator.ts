import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

export const ApiOkPaginationResponseCustom = <GenericType extends Type<unknown>, NestedType extends Type<unknown>>(
    // eslint-disable-next-line
    responseModel: Function,
    pagination: GenericType,
    data: NestedType
) =>
    applyDecorators(
        ApiExtraModels(responseModel, pagination, data),
        ApiOkResponse({
            description: "",
            schema: {
                allOf: [
                    { $ref: getSchemaPath(responseModel) },
                    {
                        properties: {
                            data: {
                                $ref: getSchemaPath(pagination),
                                properties: {
                                    items: {
                                        type: "array",
                                        items: {
                                            $ref: getSchemaPath(data)
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        })
    );
