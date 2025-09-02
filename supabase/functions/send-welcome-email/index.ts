import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  type?: 'welcome' | 'scan-complete' | 'receipt';
  scanUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, type = 'welcome', scanUrl }: WelcomeEmailRequest = await req.json();

    let subject = "Welcome to PulseSpark.ai!";
    let html = `
      <div style="color: #1A1A1A; background: #F8FAFF; padding: 24px; font-family: Arial, sans-serif;">
        <h1 style="color: #6B5BFF;">Thanks for joining PulseSpark.ai!</h1>
        <p>Welcome ${name}! Start your AI visibility journey with our powerful analytics platform.</p>
        <p>Get started by visiting your dashboard and running your first scan.</p>
        <p>Best regards,<br>The PulseSpark.ai Team</p>
      </div>
    `;

    if (type === 'scan-complete') {
      subject = "Your AI Visibility Scan is Complete!";
      html = `
        <div style="color: #1A1A1A; background: #F8FAFF; padding: 24px; font-family: Arial, sans-serif;">
          <h1 style="color: #6B5BFF;">Scan Complete!</h1>
          <p>Hi ${name},</p>
          <p>Your AI visibility scan has finished processing. View your results and insights now:</p>
          ${scanUrl ? `<a href="${scanUrl}" style="background: #6B5BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">View Scan Results</a>` : ''}
          <p>Discover how your brand appears across AI platforms and get actionable insights to improve your visibility.</p>
          <p>Best regards,<br>The PulseSpark.ai Team</p>
        </div>
      `;
    } else if (type === 'receipt') {
      subject = "Payment Confirmation - PulseSpark.ai Pro";
      html = `
        <div style="color: #1A1A1A; background: #F8FAFF; padding: 24px; font-family: Arial, sans-serif;">
          <h1 style="color: #6B5BFF;">Payment Confirmed!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for upgrading to PulseSpark.ai Pro! Your subscription is now active.</p>
          <p>You now have access to:</p>
          <ul style="color: #1A1A1A;">
            <li>Advanced AI visibility scoring</li>
            <li>Unlimited scans</li>
            <li>Competitor analysis</li>
            <li>Priority support</li>
          </ul>
          <p>Best regards,<br>The PulseSpark.ai Team</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "PulseSpark.ai <no-reply@pulsespark.ai>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);