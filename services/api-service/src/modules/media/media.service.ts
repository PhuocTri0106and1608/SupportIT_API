import { Injectable } from '@nestjs/common';
import { ResponseType } from '@common/dtos';
import { CodeResponseEnum } from '@common/enums';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@environments';
import { slugify } from '@utils';
import toStream = require('buffer-to-stream');

@Injectable()
export class MediaService {
    constructor() {
        cloudinary.config({
            cloud_name: env.cloudinary.CLOUD_NAME,
            api_key: env.cloudinary.API_KEY,
            api_secret: env.cloudinary.API_SECRET,
        });
    }

    async uploadFileToPublicBucket(
        path: string,
        {
            file,
            fileName,
        }: {
            file: Express.Multer.File;
            fileName: string;
        },
    ): Promise<ResponseType> {
        const parts = fileName.split('.');
        const extension = parts.length > 1 ? parts.pop() : '';
        const filename = slugify(parts.join('.'));
        const public_id = `${path}/${Date.now().toString()}-${filename}`;

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id,
                    resource_type: 'auto', // hỗ trợ image, video, pdf,...
                    folder: path,
                },
                (error, result) => {
                    if (error) {
                        reject({
                            code: CodeResponseEnum.ERROR,
                            message: 'Upload to Cloudinary failed',
                            error,
                        });
                    } else {
                        resolve({
                            code: CodeResponseEnum.SUCCESS,
                            data: {
                                imageUrl: result.secure_url,
                                publicId: result.public_id,
                            },
                        });
                    }
                },
            );

            toStream(file.buffer).pipe(uploadStream);
        });
    }

    async deleteFileFromPublicBucket(publicId: string): Promise<ResponseType> {
        try {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: 'auto',
            });

            return {
                code: CodeResponseEnum.SUCCESS,
            };
        } catch (error) {
            return {
                code: CodeResponseEnum.ERROR,
            };
        }
    }
}
