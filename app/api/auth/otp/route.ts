import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, HTTP_STATUS, createResponse } from '@/lib/api-response';

// Global cache for OTPs to avoid database schema changes
const globalForOTP = global as unknown as { otpCache: Map<string, { otp: string, expires: number }> };
if (!globalForOTP.otpCache) {
  globalForOTP.otpCache = new Map();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return createResponse(errorResponse('BAD_REQUEST', 'Email is required'), HTTP_STATUS.BAD_REQUEST);
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return createResponse(errorResponse('NOT_FOUND', 'User with this email not found'), HTTP_STATUS.NOT_FOUND);
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in memory (expires in 10 minutes)
    globalForOTP.otpCache.set(email.toLowerCase(), {
      otp,
      expires: Date.now() + 10 * 60 * 1000
    });

    try {
      // Send email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Assessment Portal" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
        html: `<h3>Password Reset</h3><p>Your OTP for password reset is: <strong>${otp}</strong></p><p>It is valid for 10 minutes.</p>`,
      });

      return createResponse(successResponse(null, 'OTP sent successfully to email'), HTTP_STATUS.OK);
    } catch (emailError: any) {
      console.error('[Primary SMTP Error]', emailError.message);
      
      // Fallback to Ethereal Email for demo/development purposes if standard SMTP fails
      try {
        console.log('Generating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        const fallbackTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await fallbackTransporter.sendMail({
          from: '"Assessment Portal (Fallback)" <no-reply@ethereal.email>',
          to: email,
          subject: "Password Reset OTP",
          text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
          html: `<h3>Password Reset</h3><p>Your OTP for password reset is: <strong>${otp}</strong></p><p>It is valid for 10 minutes.</p>`,
        });

        console.log("-----------------------------------------");
        console.log("FALLBACK EMAIL SENT VIA ETHEREAL!");
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        console.log("OTP for testing: " + otp);
        console.log("-----------------------------------------");

        return createResponse(successResponse(null, 'OTP sent successfully to email (Fallback generated)'), HTTP_STATUS.OK);
      } catch (fallbackError: any) {
        console.error('[Fallback OTP Error]', fallbackError);
        return createResponse(errorResponse('INTERNAL_ERROR', 'Failed to send OTP email completely.'), HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
    }
  } catch (error: any) {
    console.error('[OTP Global Error]', error);
    return createResponse(errorResponse('INTERNAL_ERROR', 'Failed to process request.'), HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export function getCachedOTP(email: string): string | null {
  const data = globalForOTP.otpCache.get(email.toLowerCase());
  if (!data) return null;
  if (Date.now() > data.expires) {
    globalForOTP.otpCache.delete(email.toLowerCase());
    return null;
  }
  return data.otp;
}

export function clearCachedOTP(email: string) {
  globalForOTP.otpCache.delete(email.toLowerCase());
}
