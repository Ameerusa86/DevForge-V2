import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "DevForge <onboarding@resend.dev>";
const devEmailOverride = process.env.DEV_EMAIL_OVERRIDE || process.env.ADMIN_EMAIL;
const appUrl = (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailRecipient {
  email: string;
  name?: string | null;
}

/**
 * Resolves the destination email. In development/testing, if ADMIN_EMAIL or DEV_EMAIL_OVERRIDE
 * is set, all emails route to your personal inbox to comply with Resend's free tier.
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #ff6636; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 700; text-align: center; letter-spacing: 0.5px; text-transform: uppercase;">
          Dev Sandbox Mode &bull; Forwarded to your Gmail (Original recipient: ${originalEmail})
        </td>
      </tr>
    </table>
  `;
}

/**
 * Shared, bulletproof email shell wrapper designed for maximum compatibility across
 * Gmail, Apple Mail, Outlook, and mobile mail clients.
 */
function renderEmailShell({
  preheader,
  badgeText,
  badgeColor = "#ff6636",
  title,
  subtitle,
  contentHtml,
  devBannerHtml = "",
}: {
  preheader: string;
  badgeText?: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  contentHtml: string;
  devBannerHtml?: string;
}): string {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${title}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #080a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a { color: #ff6636; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container-table { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .stat-card { display: block !important; width: 100% !important; margin-bottom: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #080a0f; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Hidden Preheader Preview Text -->
  <div style="display: none; font-size: 1px; color: #080a0f; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" bgcolor="#080a0f" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; background-color: #080a0f;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Email Container -->
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" class="container-table" style="max-width: 580px; width: 100%; background-color: #11141d; border: 1px solid #202534; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Accent Brand Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #ff6636 0%, #ff8c42 50%, #ffa559 100%); line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Header / Brand Section -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #1c212f;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #ff6636; width: 34px; height: 34px; border-radius: 8px; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 16px; font-weight: 900; line-height: 34px; display: inline-block;">&#9889;</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="font-size: 19px; font-weight: 900; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">DevForge</span>
                          <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase;">Academy</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <a href="${appUrl}" style="font-size: 12px; font-weight: 600; color: #94a3b8; text-decoration: none;">Launch App &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td class="mobile-padding" style="padding: 36px 36px 28px 36px;">
              ${devBannerHtml}

              ${
                badgeText
                  ? `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                  <tr>
                    <td style="background-color: rgba(255, 102, 54, 0.12); border: 1px solid ${badgeColor}; border-radius: 20px; padding: 4px 12px;">
                      <span style="font-size: 10px; font-weight: 800; color: ${badgeColor}; letter-spacing: 1px; text-transform: uppercase;">${badgeText}</span>
                    </td>
                  </tr>
                </table>
              `
                  : ""
              }

              <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 10px 0; letter-spacing: -0.5px; line-height: 1.3;">
                ${title}
              </h1>

              ${
                subtitle
                  ? `
                <p style="font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0;">
                  ${subtitle}
                </p>
              `
                  : ""
              }

              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td class="mobile-padding" style="padding: 28px 36px 36px 36px; background-color: #0d0f17; border-top: 1px solid #1a1e2b; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="${appUrl}/courses" style="font-size: 12px; font-weight: 600; color: #94a3b8; text-decoration: none; margin: 0 10px;">Courses</a>
                    <span style="color: #334155; font-size: 12px;">&bull;</span>
                    <a href="${appUrl}/community" style="font-size: 12px; font-weight: 600; color: #94a3b8; text-decoration: none; margin: 0 10px;">Community</a>
                    <span style="color: #334155; font-size: 12px;">&bull;</span>
                    <a href="${appUrl}/contact" style="font-size: 12px; font-weight: 600; color: #94a3b8; text-decoration: none; margin: 0 10px;">Support</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 12px; color: #64748b; line-height: 1.6;">
                    &copy; ${currentYear} DevForge. Built for developers mastering production architecture.<br />
                    You are receiving this notification from your DevForge workspace.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
    ? `Welcome to DevForge, ${name}! [For: ${recipient.email}]`
    : `Welcome to DevForge, ${name}!`;

  const contentHtml = `
    <!-- Value Pillars -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background-color: #171b26; border: 1px solid #232a3b; border-radius: 12px; padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="36" valign="top" style="padding-right: 12px;">
                <div style="background-color: rgba(255, 102, 54, 0.15); width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">
                  &#128187;
                </div>
              </td>
              <td valign="top">
                <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Production-Grade Curriculum</div>
                <div style="font-size: 13px; color: #94a3b8; line-height: 1.5;">Build real-world architectures, learn clean code patterns, and write scalable systems.</div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1f2535;">
            <tr>
              <td width="36" valign="top" style="padding-right: 12px;">
                <div style="background-color: rgba(255, 102, 54, 0.15); width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">
                  &#127916;
                </div>
              </td>
              <td valign="top">
                <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Interactive Streaming & Quizzes</div>
                <div style="font-size: 13px; color: #94a3b8; line-height: 1.5;">Watch HD video lessons with embedded YouTube streaming and test your retention with quizzes.</div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1f2535;">
            <tr>
              <td width="36" valign="top" style="padding-right: 12px;">
                <div style="background-color: rgba(255, 102, 54, 0.15); width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">
                  &#128172;
                </div>
              </td>
              <td valign="top">
                <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Vibrant Community & Mentorship</div>
                <div style="font-size: 13px; color: #94a3b8; line-height: 1.5;">Join developer discussions, share code reviews, and participate in live workshops.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Call to Action Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color: #ff6636; border-radius: 10px; box-shadow: 0 4px 14px rgba(255, 102, 54, 0.35);">
                <a href="${appUrl}/courses" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                  Explore Course Catalog &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; color: #64748b; line-height: 1.6; text-align: center; margin: 0;">
      Need any guidance finding the right course track? Visit our <a href="${appUrl}/contact" style="color: #ff6636; text-decoration: underline;">help desk</a> anytime.
    </p>
  `;

  const html = renderEmailShell({
    preheader: "Your DevForge developer workspace is ready. Start learning today.",
    badgeText: "Welcome aboard",
    badgeColor: "#ff6636",
    title: `Welcome to DevForge, ${name}!`,
    subtitle: "You're now part of a dedicated developer platform built to take your engineering skills from foundational to production-ready.",
    contentHtml,
    devBannerHtml: getDevBanner(recipient.email, isOverridden && to !== recipient.email),
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
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
  const numPrice = Number(course.price) || 0;
  const formattedPrice = numPrice === 0 ? "Free" : `$${numPrice.toFixed(2)}`;
  const courseUrl = `${appUrl}/courses/${course.slug}`;
  const receiptId = `DF-${Date.now().toString(36).toUpperCase()}`;
  const dateFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const { to, isOverridden } = resolveRecipient(recipient.email);

  if (!resend) {
    console.log(`[Email Mock] Enrollment receipt sent to ${recipient.email} for ${course.title}`);
    return { success: true, mocked: true };
  }

  const subject = isOverridden && to !== recipient.email
    ? `Enrollment Confirmed: ${course.title} [For: ${recipient.email}]`
    : `Enrollment Confirmed: ${course.title}`;

  const contentHtml = `
    <!-- Receipt Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background-color: #171b26; border: 1px solid #232a3b; border-radius: 12px; padding: 24px;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
            <tr>
              <td align="left">
                <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Official Receipt</span>
              </td>
              <td align="right">
                <span style="font-size: 11px; font-weight: 700; color: #ff6636; background-color: rgba(255, 102, 54, 0.12); padding: 3px 8px; border-radius: 6px;">${receiptId}</span>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #1f2535; font-size: 13px; color: #94a3b8;">Item</td>
              <td align="right" style="padding: 10px 0; border-bottom: 1px solid #1f2535; font-size: 14px; font-weight: 700; color: #ffffff;">${course.title}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #1f2535; font-size: 13px; color: #94a3b8;">Access Type</td>
              <td align="right" style="padding: 10px 0; border-bottom: 1px solid #1f2535; font-size: 13px; font-weight: 600; color: #22c55e;">Lifetime Full Access</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #1f2535; font-size: 13px; color: #94a3b8;">Date</td>
              <td align="right" style="padding: 10px 0; border-bottom: 1px solid #1f2535; font-size: 13px; color: #cbd5e1;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 14px 0 4px 0; font-size: 14px; font-weight: 700; color: #ffffff;">Total Amount</td>
              <td align="right" style="padding: 14px 0 4px 0; font-size: 18px; font-weight: 800; color: #ff6636;">${formattedPrice}</td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    <!-- Call to Action Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color: #ff6636; border-radius: 10px; box-shadow: 0 4px 14px rgba(255, 102, 54, 0.35);">
                <a href="${courseUrl}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                  Start Learning Now &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #64748b; line-height: 1.6; text-align: center; margin: 0;">
      Please retain this email as proof of your enrollment. You can access your course anytime from your <a href="${appUrl}/dashboard" style="color: #ff6636; text-decoration: underline;">student dashboard</a>.
    </p>
  `;

  const html = renderEmailShell({
    preheader: `Your enrollment in ${course.title} is confirmed. Access your lessons now.`,
    badgeText: "Enrollment Confirmed",
    badgeColor: "#22c55e",
    title: "You're In! Let's Start Building.",
    subtitle: `Hey ${name}, your enrollment in "${course.title}" is officially confirmed. All modules, code exercises, and quizzes are unlocked.`,
    contentHtml,
    devBannerHtml: getDevBanner(recipient.email, isOverridden && to !== recipient.email),
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
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
  const dashboardUrl = `${appUrl}/dashboard`;
  const { to, isOverridden } = resolveRecipient(recipient.email);

  if (!resend) {
    console.log(`[Email Mock] Weekly digest to ${recipient.email} (Streak: ${digest.streakDays}d)`);
    return { success: true, mocked: true };
  }

  const subject = isOverridden && to !== recipient.email
    ? `Your Weekly DevForge Progress (${digest.streakDays}-Day Streak) [For: ${recipient.email}]`
    : `Your Weekly DevForge Progress (${digest.streakDays}-Day Streak)`;

  // Render course progress bars using email-bulletproof HTML tables
  const courseRowsHtml = digest.activeCourses.length > 0
    ? digest.activeCourses.map(course => {
        const pct = Math.min(100, Math.max(0, Math.round(course.progress)));
        return `
          <div style="margin-bottom: 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 6px;">
              <tr>
                <td align="left" style="font-size: 13px; font-weight: 700; color: #ffffff;">${course.title}</td>
                <td align="right" style="font-size: 13px; font-weight: 800; color: #ff6636;">${pct}%</td>
              </tr>
            </table>
            <table role="presentation" width="100%" height="6" bgcolor="#1f2535" cellpadding="0" cellspacing="0" border="0" style="border-radius: 3px; overflow: hidden; background-color: #1f2535;">
              <tr>
                <td width="${pct}%" bgcolor="#ff6636" style="background-color: #ff6636; height: 6px; border-radius: 3px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                ${pct < 100 ? `<td width="${100 - pct}%" style="font-size: 1px; line-height: 1px;">&nbsp;</td>` : ""}
              </tr>
            </table>
          </div>
        `;
      }).join("")
    : `<p style="color: #94a3b8; font-size: 13px; margin: 0;">No active course progress recorded this week. Jump back in to rebuild your streak!</p>`;

  const contentHtml = `
    <!-- Stats Row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td class="stat-card" width="48%" valign="top" style="background-color: #171b26; border: 1px solid #232a3b; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 28px; font-weight: 900; color: #ff6636; line-height: 1.1; margin-bottom: 4px;">
            ${digest.streakDays} <span style="font-size: 18px;">&#128293;</span>
          </div>
          <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Day Streak</div>
        </td>
        <td width="4%">&nbsp;</td>
        <td class="stat-card" width="48%" valign="top" style="background-color: #171b26; border: 1px solid #232a3b; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 28px; font-weight: 900; color: #ffffff; line-height: 1.1; margin-bottom: 4px;">
            ${digest.completedLessons} <span style="font-size: 18px;">&#9989;</span>
          </div>
          <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Lessons Finished</div>
        </td>
      </tr>
    </table>

    <!-- Active Courses Section -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background-color: #171b26; border: 1px solid #232a3b; border-radius: 12px; padding: 24px;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
            Active Courses Progress
          </div>
          ${courseRowsHtml}
        </td>
      </tr>
    </table>

    <!-- Call to Action Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color: #ff6636; border-radius: 10px; box-shadow: 0 4px 14px rgba(255, 102, 54, 0.35);">
                <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                  Continue Your Learning Track &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #64748b; line-height: 1.6; text-align: center; margin: 0;">
      Consistency is the architect of mastery. 20 minutes a day beats 5 hours on a weekend.
    </p>
  `;

  const html = renderEmailShell({
    preheader: `DevForge Recap: You're on a ${digest.streakDays}-day learning streak with ${digest.completedLessons} lessons finished.`,
    badgeText: "Weekly Momentum Report",
    badgeColor: "#ff6636",
    title: `Great momentum this week, ${name}!`,
    subtitle: "Here is your weekly summary of achievements, study consistency, and current course progress.",
    contentHtml,
    devBannerHtml: getDevBanner(recipient.email, isOverridden && to !== recipient.email),
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
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
  const initials = (submission.name || "U")
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formattedDate = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (!resend) {
    console.log(
      `[Email Mock] Contact form message from ${submission.name} (${submission.email}) to ${to}: ${submission.subject}`
    );
    return { success: true, mocked: true };
  }

  const contentHtml = `
    <!-- User Info Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #171b26; border: 1px solid #232a3b; border-radius: 12px; padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="48" valign="top" style="padding-right: 14px;">
                <div style="background-color: #ff6636; width: 44px; height: 44px; border-radius: 22px; text-align: center; line-height: 44px; color: #ffffff; font-weight: 800; font-size: 15px; letter-spacing: 0.5px;">
                  ${initials}
                </div>
              </td>
              <td valign="middle">
                <div style="font-size: 16px; font-weight: 800; color: #ffffff;">${submission.name}</div>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 2px;">
                  <a href="mailto:${submission.email}" style="color: #ff6636; text-decoration: none;">${submission.email}</a>
                </div>
              </td>
              <td align="right" valign="middle">
                <span style="font-size: 11px; font-weight: 600; color: #64748b;">${formattedDate}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Subject & Message Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background-color: #171b26; border-left: 4px solid #ff6636; border-top: 1px solid #232a3b; border-right: 1px solid #232a3b; border-bottom: 1px solid #232a3b; border-radius: 0 12px 12px 0; padding: 24px;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            Subject
          </div>
          <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 18px;">
            ${submission.subject}
          </div>

          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            Message
          </div>
          <div style="font-size: 14px; color: #e2e8f0; line-height: 1.7; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${submission.message}</div>
        </td>
      </tr>
    </table>

    <!-- Direct Action Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color: #ff6636; border-radius: 10px; box-shadow: 0 4px 14px rgba(255, 102, 54, 0.35);">
                <a href="mailto:${submission.email}?subject=${encodeURIComponent("Re: " + submission.subject)}" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                  Reply Directly to ${submission.name} &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${appUrl}/admin/messages" style="font-size: 12px; font-weight: 600; color: #94a3b8; text-decoration: underline;">
            View in Admin Dashboard &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailShell({
    preheader: `[New Support Ticket] ${submission.name}: "${submission.subject}"`,
    badgeText: "Support Request",
    badgeColor: "#38bdf8",
    title: "New Customer Inquiry Received",
    subtitle: `A new message was submitted via the DevForge contact desk from ${submission.name}.`,
    contentHtml,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      replyTo: submission.email,
      subject: `[DevForge Support] ${submission.subject}`,
      html,
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
