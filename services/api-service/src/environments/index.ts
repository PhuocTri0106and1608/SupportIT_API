import { OAuthProvidersEnum } from "@common/enums";
import dotenv from "dotenv";

const envFile = `.env`;
dotenv.config({ path: envFile });

const {
    PORT,
    NODE_ENV,
    CORS_ORIGINS,
    API_URL,
    CLIENT_URL,
    API_VERSION,
    REDIS_URL,
    REDIS_GLOBAL_PREFIX,
    SERVICE_NAME,
    MONGODB_URI,
    MONGO_DB_NAME,
    API_TIMEOUT,
    THROTTLE_TTL,
    THROTTLE_LIMIT,
    ADMIN_SALT_ROUND,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CANDIDATE_REDIRECT_URL,
    GOOGLE_RECRUITER_REDIRECT_URL,
    GOOGLE_ADMIN_REDIRECT_URL,
    GOOGLE_AUTHORIZATION_URL,
    GOOGLE_TOKEN_URL,
    JWT_ACCESS_SECRET,
    JWT_EXPIRES_IN,
    OTP_LENGTH,
    OTP_LIFE,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASSWORD,
    BULL_PREFIX,
    BLOOM_FILTER_SIZE,
    BLOOM_FILTER_FALSE_POSITIVE_RATE,
    DIGITAL_OCEAN_PUBLIC_BUCKET,
    DIGITAL_OCEAN_REGION,
    DIGITAL_OCEAN_ENDPOINT,
    DIGITAL_OCEAN_ACCESS_KEY_ID,
    DIGITAL_OCEAN_ACCESS_KEY,
    CDN_URL,
    REVIEW_CV_URL,
    EXTRACT_CV_URL,
    EXTRACT_JD_URL,
    EXTRACT_JD_TEXT,
    EVALUATE_INTERVIEW_URL,
    SUGGEST_URL,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    RAPID_API_KEY,
    RECOMBEE_DB_PROD,
    RECOMBEE_PROD_PRIVATE_TOKEN,
    RECOMBEE_PROD_PUBLIC_TOKEN,
    RECOMBEE_DB_DEV,
    RECOMBEE_DEV_PRIVATE_TOKEN,
    RECOMBEE_DEV_PUBLIC_TOKEN,
} = process.env;

enum EnvEnum {
    STAGING = "staging",
    PRODUCTION = "production",
    DEVELOPMENT = "development"
}

if (NODE_ENV && !["staging", "production", "development"].includes(NODE_ENV)) {
    throw new Error("NODE_ENV must be either production, staging or development");
}

if (!CORS_ORIGINS) {
    throw new Error("CORS_ORIGINS env is not define");
}

if (!PORT) {
    throw new Error("PORT env is not define");
}

if (!RAPID_API_KEY) {
    throw new Error("RAPID_API_KEY env is not define");
}

if (!API_URL || !CLIENT_URL || !API_VERSION) {
    throw new Error("API_URL || CLIENT_URL env is not define");
}

if (!SERVICE_NAME) {
    throw new Error("SERVICE_NAME env is not define");
}

if (!ADMIN_SALT_ROUND) {
    throw new Error("ADMIN_SALT_ROUND env is not define");
}

if (!REDIS_URL || !REDIS_GLOBAL_PREFIX) {
    throw new Error("REDIS_URL || REDIS_GLOBAL_PREFIX env is not define");
}

if (!MONGODB_URI || !MONGO_DB_NAME) {
    throw new Error("MONGODB_URI || MONGO_DB_NAME env is not define");
}

if (!JWT_ACCESS_SECRET || !JWT_EXPIRES_IN) {
    throw new Error("JWT_ACCESS_SECRET || JWT_EXPIRES_IN env is not define");
}

if (!OTP_LENGTH || !OTP_LIFE) {
    throw new Error("OTP_LENGTH || OTP_LIFE env is not define");
}

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_SECURE || !EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error("EMAIL_HOST || EMAIL_PORT || EMAIL_SECURE || EMAIL_USER || EMAIL_PASSWORD env is not define");
}

if (!BULL_PREFIX) {
    throw new Error("BULL_PREFIX env is not define");
}

if (!DIGITAL_OCEAN_PUBLIC_BUCKET || !DIGITAL_OCEAN_REGION || !DIGITAL_OCEAN_ENDPOINT || !DIGITAL_OCEAN_ACCESS_KEY_ID || !DIGITAL_OCEAN_ACCESS_KEY || !CDN_URL) {
    throw new Error(
        "DIGITAL_OCEAN_PUBLIC_BUCKET || DIGITAL_OCEAN_REGION || DIGITAL_OCEAN_ENDPOINT || DIGITAL_OCEAN_ACCESS_KEY_ID || DIGITAL_OCEAN_ACCESS_KEY || CDN_URL env is not define"
    );
}

if (!REVIEW_CV_URL || !EXTRACT_CV_URL || !EXTRACT_JD_URL || !EXTRACT_JD_TEXT || !EVALUATE_INTERVIEW_URL || !SUGGEST_URL) {
    throw new Error("REVIEW_CV_URL || EXTRACT_CV_URL || EXTRACT_JD_URL || EXTRACT_JD_TEXT || EVALUATE_INTERVIEW_URL || SUGGEST_URL env is not define");
}

if (!RECOMBEE_DB_PROD || !RECOMBEE_PROD_PRIVATE_TOKEN || !RECOMBEE_PROD_PUBLIC_TOKEN || !RECOMBEE_DB_DEV || !RECOMBEE_DEV_PRIVATE_TOKEN || !RECOMBEE_DEV_PUBLIC_TOKEN) {
    console.error(RECOMBEE_DB_PROD, RECOMBEE_PROD_PRIVATE_TOKEN, RECOMBEE_PROD_PUBLIC_TOKEN, RECOMBEE_DB_DEV, RECOMBEE_DEV_PRIVATE_TOKEN, RECOMBEE_DEV_PUBLIC_TOKEN);
    throw new Error("RECOMBEE_DB_PROD || RECOMBEE_PROD_PRIVATE_TOKEN || RECOMBEE_PROD_PUBLIC_TOKEN || RECOMBEE_DB_DEV || RECOMBEE_DEV_PRIVATE_TOKEN || RECOMBEE_DEV_PUBLIC_TOKEN env is not define");
}

export const env = {
    // Service env
    SERVICE_NAME,
    NODE_ENV,
    PORT,
    API_URL,
    CLIENT_URL,
    API_VERSION,
    API_TIMEOUT: Number(API_TIMEOUT),

    // Cors env
    corsConfig: {
        ORIGINS: CORS_ORIGINS,
        CREDENTIALS: NODE_ENV === "production"
    },

    // Redis
    redis: {
        URL: REDIS_URL,
        GLOBAL_PREFIX: REDIS_GLOBAL_PREFIX
    },

    // Mongodb
    db: {
        MONGODB_URI,
        MONGO_DB_NAME
    },

    rateLimit: {
        THROTTLE_TTL: Number(THROTTLE_TTL),
        THROTTLE_LIMIT: Number(THROTTLE_LIMIT)
    },

    jwt: {
        access: {
            SECRET: process.env.JWT_ACCESS_SECRET,
            EXPIRES_IN: process.env.JWT_EXPIRES_IN
        }
    },

    admin: {
        access: {
            SALT_ROUND: process.env.ADMIN_SALT_ROUND
        }
    },

    cookie: {
        REFRESH_COOKIE: process.env.REFRESH_COOKIE,
        COOKIE_SECRET: process.env.COOKIE_SECRET
    },

    email: {
        HOST: EMAIL_HOST,
        PORT: parseInt(EMAIL_PORT, 10),
        SECURE: EMAIL_SECURE === "true",
        auth: {
            USER: EMAIL_USER,
            PASS: EMAIL_PASSWORD
        }
    },

    oauth2: {
        [OAuthProvidersEnum.GOOGLE]: {
            CLIENT_ID: GOOGLE_CLIENT_ID,
            CLIENT_SECRET: GOOGLE_CLIENT_SECRET,
            CANDIDATE_REDIRECT_URL: GOOGLE_CANDIDATE_REDIRECT_URL,
            RECRUITER_REDIRECT_URL: GOOGLE_RECRUITER_REDIRECT_URL,
            ADMIN_REDIRECT_URL: GOOGLE_ADMIN_REDIRECT_URL,
            AUTHORIZATION_URL: GOOGLE_AUTHORIZATION_URL,
            TOKEN_URL: GOOGLE_TOKEN_URL
        }
    },

    cloudinary: {
        CLOUD_NAME: CLOUDINARY_CLOUD_NAME,
        API_KEY: CLOUDINARY_API_KEY,
        API_SECRET: CLOUDINARY_API_SECRET,
    },

    otp: {
        LENGTH: parseInt(OTP_LENGTH, 10),
        LIFE: parseInt(OTP_LIFE, 10)
    },

    IS_TESTING: NODE_ENV !== EnvEnum.PRODUCTION,

    bull: {
        BULL_PREFIX: BULL_PREFIX,
        REDIS_URL
    },

    bloomFilter: {
        SIZE: parseInt(BLOOM_FILTER_SIZE, 10) | 100000,
        FALSE_POSITIVE_RATE: parseFloat(BLOOM_FILTER_FALSE_POSITIVE_RATE) || 0.001
    },

    digitalOcean: {
        PUBLIC_BUCKET: DIGITAL_OCEAN_PUBLIC_BUCKET,
        REGION: DIGITAL_OCEAN_REGION,
        ENDPOINT: DIGITAL_OCEAN_ENDPOINT,
        ACCESS_KEY_ID: DIGITAL_OCEAN_ACCESS_KEY_ID,
        ACCESS_KEY: DIGITAL_OCEAN_ACCESS_KEY,
        CDN_URL
    },

    flask: {
        REVIEW_CV_URL,
        EXTRACT_CV_URL,
        EXTRACT_JD_URL,
        EXTRACT_JD_TEXT,
        EVALUATE_INTERVIEW_URL,
        SUGGEST_URL
    },

    judge0Api: {
        RAPID_API_KEY
    },

    recombee: {
        DB_PROD: RECOMBEE_DB_PROD,
        PROD_PRIVATE_TOKEN: RECOMBEE_PROD_PRIVATE_TOKEN,
        PROD_PUBLIC_TOKEN: RECOMBEE_PROD_PUBLIC_TOKEN,
        DB_DEV: RECOMBEE_DB_DEV,
        DEV_PRIVATE_TOKEN: RECOMBEE_DEV_PRIVATE_TOKEN,
        DEV_PUBLIC_TOKEN: RECOMBEE_DEV_PUBLIC_TOKEN
    }
} as const;
