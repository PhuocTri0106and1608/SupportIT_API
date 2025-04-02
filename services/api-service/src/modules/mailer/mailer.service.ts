import { InternalResponseType } from "@common/dtos";
import { env } from "@environments";
import { logger } from "@modules/logger";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { existsSync, readFileSync } from "fs";
import Handlebars from "handlebars";
import { createTransport, Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { join } from "path";
import { ITemplatedData, ITemplates, IUseEmailInfo } from "./interfaces";

@Injectable()
export class MailerService implements OnModuleInit {
    private templates: ITemplates;
    private transport: Transporter<SMTPTransport.SentMessageInfo>;
    private email: string;

    private static parseTemplate(templateName: string): Handlebars.TemplateDelegate<ITemplatedData> {
        const templatePath = join(__dirname, "templates", templateName);

        if (!existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        const templateText = readFileSync(templatePath, "utf-8");
        return Handlebars.compile<ITemplatedData>(templateText, { strict: true });
    }

    async onModuleInit() {
        const emailConfig: SMTPTransport.Options = {
            auth: {
                user: env.email.auth.USER,
                pass: env.email.auth.PASS
            },
            host: env.email.HOST,
            port: env.email.PORT,
            secure: env.email.SECURE
        };

        this.templates = {
            otp: MailerService.parseTemplate("otp.hbs")
        };
        this.transport = createTransport(emailConfig);
        this.email = `"My App" <${emailConfig.auth.user}>`;

        this.transport
            .verify()
            .then(() => {
                logger.info("MailerService connected successfully.");
            })
            .catch((error) => {
                logger.error("MailerService failed to connect:", error);
            });
    }

    async sendEmail(to: string, subject: string, html: string): Promise<InternalResponseType> {
        try {
            await this.transport.sendMail({ from: this.email, to, subject, html });
            return {
                result: true
            };
        } catch (error) {
            return {
                result: false,
                error: error
            };
        }
    }

    async sendOtpEmail(userInfo: IUseEmailInfo, code: string): Promise<InternalResponseType> {
        const { email } = userInfo;
        const subject = "OTP to login";

        try {
            const html = this.templates.otp({
                code: code
            });

            return this.sendEmail(email, subject, html);
        } catch (e) {
            return {
                result: false,
                error: e
            };
        }
    }
}
