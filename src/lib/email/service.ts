import { Resend } from "resend";
import { renderEmailTemplate, type EmailTemplateName } from "./templates";

export async function sendMarketplaceEmail(input: {
  to?: string | null;
  template: EmailTemplateName;
  variables?: Record<string, string | number | null | undefined>;
}) {
  if (!input.to || !process.env.RESEND_API_KEY) {
    return { skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const template = renderEmailTemplate(input.template, input.variables);
  const from = process.env.RESEND_FROM_EMAIL ?? "NEXUS MLBB <noreply@nexus-mlbb.com>";

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: template.subject,
    html: template.html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false, id: data?.id };
}
