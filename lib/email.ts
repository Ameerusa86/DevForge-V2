import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "DevForge <onboarding@resend.dev>";
const devEmailOverride = process.env.DEV_EMAIL_OVERRIDE || process.env.ADMIN_EMAIL;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailRecipient {
  email: string;
  name?: string | null;
}

/**
 * Resolves the destination email. In development/testing, if ADMIN_EMAIL or DEV_EMAIL_OVERRIDE
 * is set, all emails route to your own personal inbox to comply with Resend's free tier.
 */
function resolveRecipient(targetEmail: string): { to: string; isOverridden: boolean } {
  if (devEmailOverride && devEmailOverride.trim()) {
    return { to: devEmailOverride.trim(), isOverridden: true };
  }
  return { to: targetEmail, isOverridden: false };
}

function getDevBanner(originalEmail: string, isOverridden: boolean): string {
  if (!isOverridden) return "";
  return `
    <div style="background-color: #ff6636; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-bottom: 16px; text-align: center;">
      Dev Sandbox: Forwarded to your Gmail (Original recipient: ${originalEmail})
    </div>
  `;
}

/**
 * 1. Welcome Email upon Sign-Up
 */
export async function sendWelcomeEmail(recipient: EmailRecipient) {
  const name = recipient.name || "Developer";
  const { to, isOverridden } = resolveRecipient(recipient.email);

  if (!resend) {
    console.log(`[Email Mock] Welcome email to ${recipient.email} (Key not configured)`);
    return { success: true, mocked: true };
  }

  const subject = isOverridden && to !== recipient.email
    ? `Welcome to DevForge! 🚀 [For: ${recipient.email}]`
    : "Welcome to DevForge! 🚀";

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c0e; color: #f3f4f6; margin: 0; padding: 40px 20px; }
            .container { max-width: 580px; margin: 0 auto; background-color: #121418; border: 1px solid #23272f; border-radius: 12px; padding: 32px; }
            .brand { color: #ff6636; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
            h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin-top: 0; }
            p { font-size: 15px; line-height: 1.6; color: #9ca3af; }
            .btn { display: inline-block; background-color: #ff6636; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .card { background-color: #181b21; border: 1px solid #2d323d; border-radius: 8px; padding: 16px; margin: 20px 0; }
            .footer { margin-top: 32px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            ${getDevBanner(recipient.email, isOverridden && to !== recipient.email)}
            <div class="brand">DevForge</div>
            <h1>Welcome to DevForge, ${name}!</h1>
            <p>We're thrilled to have you here. DevForge is built for engineers and creators ready to learn real-world architecture, modern frameworks, and production-ready code.</p>
            
            <div class="card">
              <strong style="color: #ffffff;">Quick Start:</strong>
              <ul style="color: #9ca3af; margin: 8px 0 0; padding-left: 20px; font-size: 14px;">
                <li>Browse curated, production-focused courses</li>
                <li>Watch in-depth video lessons with step-by-step breakdowns</li>
                <li>Test your understanding with interactive quizzes</li>
                <li>Ask questions and connect with the community</li>
              </ul>
            </div>

            <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/courses" class="btn">Explore Courses</a>

            <div class="footer">
              © ${new Date().getFullYear()} DevForge. All rights reserved.<br>
              Happy building!
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Email Error] Failed to send welcome email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email Exception] Welcome email failed:", err);
    return { success: false, error: err };
  }
}

/**
 * 2. Course Purchase / Enrollment Confirmation with Receipt
 */
export async function sendEnrollmentReceiptEmail(
  recipient: EmailRecipient,
  course: { title: string; price: number | string; slug: string },
) {
  const name = recipient.name || "Student";
  const formattedPrice = Number(course.price) === 0 ? "Free" : `$${Number(course.price).toFixed(2)}`;
  const courseUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/courses/${course.slug}`;
  const { to, isOverridden } = resolveRecipient(recipient.email);

  if (!resend) {
    console.log(`[Email Mock] Enrollment receipt sent to ${recipient.email} for ${course.title}`);
    return { success: true, mocked: true };
  }

  const subject = isOverridden && to !== recipient.email
    ? `Enrollment Confirmed: ${course.title} 🎓 [For: ${recipient.email}]`
    : `Enrollment Confirmed: ${course.title} 🎓`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c0e; color: #f3f4f6; margin: 0; padding: 40px 20px; }
            .container { max-width: 580px; margin: 0 auto; background-color: #121418; border: 1px solid #23272f; border-radius: 12px; padding: 32px; }
            .brand { color: #ff6636; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
            h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; }
            p { font-size: 15px; line-height: 1.6; color: #9ca3af; }
            .receipt { background-color: #181b21; border: 1px solid #2d323d; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #23272f; font-size: 14px; }
            .receipt-row:last-child { border-bottom: none; font-weight: 700; color: #ffffff; font-size: 15px; margin-top: 4px; }
            .btn { display: inline-block; background-color: #ff6636; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .footer { margin-top: 32px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            ${getDevBanner(recipient.email, isOverridden && to !== recipient.email)}
            <div class="brand">DevForge</div>
            <h1>You're Enrolled!</h1>
            <p>Hi ${name}, congratulations on starting <strong>${course.title}</strong>. Your enrollment has been confirmed.</p>
            
            <div class="receipt">
              <div style="font-weight: 700; color: #ffffff; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Enrollment Summary</div>
              <div class="receipt-row">
                <span style="color: #9ca3af;">Course</span>
                <span style="color: #ffffff;">${course.title}</span>
              </div>
              <div class="receipt-row">
                <span style="color: #9ca3af;">Date</span>
                <span style="color: #ffffff;">${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <div class="receipt-row">
                <span style="color: #9ca3af;">Amount</span>
                <span style="color: #ff6636;">${formattedPrice}</span>
              </div>
            </div>

            <a href="${courseUrl}" class="btn">Start Learning Now</a>

            <div class="footer">
              © ${new Date().getFullYear()} DevForge. Keep sharpening your craft.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Email Error] Failed to send receipt email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email Exception] Receipt email failed:", err);
    return { success: false, error: err };
  }
}

/**
 * 3. Weekly Streak & Progress Digest
 */
export async function sendWeeklyDigestEmail(
  recipient: EmailRecipient,
  digest: {
    completedLessons: number;
    streakDays: number;
    activeCourses: Array<{ title: string; progress: number }>;
  },
) {
  const name = recipient.name || "Builder";
  const dashboardUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/dashboard`;
  const { to, isOverridden } = resolveRecipient(recipient.email);

  if (!resend) {
    console.log(`[Email Mock] Weekly digest to ${recipient.email} (Streak: ${digest.streakDays}d)`);
    return { success: true, mocked: true };
  }

  const courseListHtml = digest.activeCourses.length > 0
    ? digest.activeCourses.map(c => `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
          <span style="color: #ffffff; font-weight: 600;">${c.title}</span>
          <span style="color: #ff6636; font-weight: 700;">${c.progress}%</span>
        </div>
        <div style="background-color: #23272f; border-radius: 4px; height: 6px; overflow: hidden;">
          <div style="background-color: #ff6636; width: ${c.progress}%; height: 100%;"></div>
        </div>
      </div>
    `).join("")
    : `<p style="color: #9ca3af; font-size: 14px;">No active courses this week. Time to jump back in!</p>`;

  const subject = isOverridden && to !== recipient.email
    ? `Your Weekly DevForge Progress (${digest.streakDays}-Day Streak 🔥) [For: ${recipient.email}]`
    : `Your Weekly DevForge Progress (${digest.streakDays}-Day Streak 🔥)`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c0e; color: #f3f4f6; margin: 0; padding: 40px 20px; }
            .container { max-width: 580px; margin: 0 auto; background-color: #121418; border: 1px solid #23272f; border-radius: 12px; padding: 32px; }
            .brand { color: #ff6636; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
            h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; }
            p { font-size: 15px; line-height: 1.6; color: #9ca3af; }
            .stats-grid { display: flex; gap: 12px; margin: 20px 0; }
            .stat-box { flex: 1; background-color: #181b21; border: 1px solid #2d323d; border-radius: 8px; padding: 16px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: 800; color: #ff6636; }
            .stat-label { font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 700; margin-top: 4px; }
            .btn { display: inline-block; background-color: #ff6636; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .footer { margin-top: 32px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            ${getDevBanner(recipient.email, isOverridden && to !== recipient.email)}
            <div class="brand">DevForge</div>
            <h1>Weekly Momentum Report</h1>
            <p>Hey ${name}, here is a snapshot of your learning streak and achievements across DevForge over the past week.</p>
            
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${digest.streakDays}</div>
                <div class="stat-label">Day Streak 🔥</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${digest.completedLessons}</div>
                <div class="stat-label">Lessons Done 🎯</div>
              </div>
            </div>

            <div style="background-color: #181b21; border: 1px solid #2d323d; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="font-weight: 700; color: #ffffff; margin-bottom: 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Active Courses</div>
              ${courseListHtml}
            </div>

            <a href="${dashboardUrl}" class="btn">Resume Learning</a>

            <div class="footer">
              © ${new Date().getFullYear()} DevForge. Consistency is the secret weapon.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Email Error] Failed to send weekly digest:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email Exception] Weekly digest failed:", err);
    return { success: false, error: err };
  }
}

/**
 * 4. Contact Form Inbound Support Notification
 */
export async function sendContactFormEmail(
  toEmail: string,
  submission: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }
) {
  const { to } = resolveRecipient(toEmail);

  if (!resend) {
    console.log(
      `[Email Mock] Contact form message from ${submission.name} (${submission.email}) to ${to}: ${submission.subject}`
    );
    return { success: true, mocked: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      replyTo: submission.email,
      subject: `[DevForge Support] ${submission.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c0e; color: #f3f4f6; margin: 0; padding: 40px 20px; }
            .container { max-width: 580px; margin: 0 auto; background-color: #121418; border: 1px solid #23272f; border-radius: 12px; padding: 32px; }
            .brand { color: #ff6636; font-size: 20px; font-weight: 800; margin-bottom: 20px; display: inline-block; }
            h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; }
            .field { margin-bottom: 16px; }
            .label { font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 700; }
            .value { font-size: 14px; color: #ffffff; margin-top: 2px; }
            .message-box { background-color: #181b21; border: 1px solid #2d323d; border-radius: 8px; padding: 16px; margin-top: 8px; font-size: 14px; color: #e5e7eb; line-height: 1.6; white-space: pre-wrap; }
            .footer { margin-top: 28px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">DevForge Support Ticket</div>
            <h1>New message from ${submission.name}</h1>
            
            <div class="field">
              <div class="label">From</div>
              <div class="value">${submission.name} &lt;${submission.email}&gt;</div>
            </div>

            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${submission.subject}</div>
            </div>

            <div class="field">
              <div class="label">Message</div>
              <div class="message-box">${submission.message}</div>
            </div>

            <div class="footer">
              Hit "Reply" in your email client to respond directly to ${submission.name} (${submission.email}).
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Email Error] Failed to send contact email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email Exception] Contact email failed:", err);
    return { success: false, error: err };
  }
}
