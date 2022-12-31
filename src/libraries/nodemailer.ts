import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const sendEmail = async (to: string, subject: string, body: string  | 'Hello world', body_type: string | 'html') => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    let config: object | any = {
        from:
            process.env.SMTP_FROM_NAME + " <" + process.env.SMTP_FROM_EMAIL + ">",
        to: to,
        subject: subject,
    };

    if (body_type === 'html') {
        config = {
            ...config,
            html: body
        }
    } else {
        config = {
            ...config,
            text: body,
        };
    }

    let info = await transporter.sendMail(config);

    console.log("Message sent: %s", info.messageId);

    return info
}

export default sendEmail