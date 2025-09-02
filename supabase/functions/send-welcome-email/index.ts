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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "PulseSpark.ai <welcome@pulsespark.ai>",
      to: [email],
      subject: "Welcome to PulseSpark.ai!",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #6B5BFF, #5A4EFF); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PulseSpark.ai!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">AI-powered website analytics platform</p>
          </div>
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #1A1A1A; margin: 0 0 20px 0;">Hi ${name}!</h2>
            <p style="color: #4A4A4A; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for joining PulseSpark.ai! You now have access to powerful AI-driven website analytics 
              that will help you understand and optimize your web presence.
            </p>
            <div style="background: #F0F0F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1A1A1A; margin: 0 0 15px 0;">Your 7-day free trial includes:</h3>
              <ul style="color: #4A4A4A; margin: 0; padding-left: 20px;">
                <li>Advanced AI visibility scoring</li>
                <li>Real-time website monitoring</li>
                <li>Competitor analysis</li>
                <li>Custom reporting & alerts</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SITE_URL")}/dashboard" 
                 style="background: #6B5BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Get Started
              </a>
            </div>
            <p style="color: #4A4A4A; line-height: 1.6; margin: 20px 0 0 0;">
              If you have any questions, feel free to reply to this email. We're here to help!
            </p>
          </div>
          <div style="background: #F9F9F9; padding: 20px; text-align: center; color: #888;">
            <p style="margin: 0;">© 2024 PulseSpark.ai. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
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