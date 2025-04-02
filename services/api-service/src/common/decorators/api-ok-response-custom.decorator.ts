import { applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

export const ApiOkResponseCustom = (responseModel: any, ...dataModels: any[]) =>
    applyDecorators(
        ApiExtraModels(responseModel, ...dataModels),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(responseModel) },
                    {
                        properties: {
                            data: {
                                oneOf: dataModels.map((dataModel) => ({
                                    $ref: getSchemaPath(dataModel)
                                }))
                            }
                        }
                    }
                ]
            }
        })
    );
