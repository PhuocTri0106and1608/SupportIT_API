import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ResponseType } from "@common/dtos";
import { CodeResponseEnum } from "@common/enums";
import { env } from "@environments";
import { Injectable } from "@nestjs/common";
import { slugify } from "@utils";

@Injectable()
export class MediaService {
    private s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            forcePathStyle: false, // Configures to use subdomain/virtual calling format.
            endpoint: env.digitalOcean.ENDPOINT,
            region: env.digitalOcean.REGION,
            credentials: {
                accessKeyId: env.digitalOcean.ACCESS_KEY_ID,
                secretAccessKey: env.digitalOcean.ACCESS_KEY
            }
        });
    }

    async uploadFileToPublicBucket(path: string, { file, fileName }: { file: Express.Multer.File; fileName: string }): Promise<ResponseType> {
        const bucketName = env.digitalOcean.PUBLIC_BUCKET;
        const parts = fileName.split(".");
        const extension = parts.length > 1 ? parts.pop() : "";
        const filename = parts.join(".");
        const fileNameSlug = slugify(filename);
        const key = `${path}/${Date.now().toString()}-${fileNameSlug}.${extension}`; // Unique key with UUID

        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: "public-read",
                ContentLength: file.size // calculate length of buffer
            })
        );
        // Return for aws s3 link
        // return `https://${bucketName}.s3.amazonaws.com/${key}`

        // Return for link digital ocean
        const imageUrl = `${env.digitalOcean.CDN_URL}/${key}`;
        return {
            code: CodeResponseEnum.SUCCESS,
            data: {
                imageUrl: imageUrl
            }
        };
    }

    async deleteFileFromPublicBucket(key: string): Promise<ResponseType> {
        await this.s3Client.send(
            new DeleteObjectCommand({
                Bucket: env.digitalOcean.PUBLIC_BUCKET,
                Key: key
            })
        );

        return {
            code: CodeResponseEnum.SUCCESS
        };
    }
}
