import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@mobilesaunarental.com'
    const contactEmail = Deno.env.get('CONTACT_EMAIL') || fromEmail

    await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      replyTo: email,
      subject: `Contact Form: ${subject || 'No Subject'} — from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
          <h2 style="color:#5C3D2E">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px;font-weight:bold;vertical-align:top;width:100px">Name</td>
              <td style="padding:8px">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px;font-weight:bold;vertical-align:top">Email</td>
              <td style="padding:8px"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${phone ? `<tr><td style="padding:8px;font-weight:bold;vertical-align:top">Phone</td><td style="padding:8px">${phone}</td></tr>` : ''}
            <tr>
              <td style="padding:8px;font-weight:bold;vertical-align:top">Subject</td>
              <td style="padding:8px">${subject || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:8px;font-weight:bold;vertical-align:top">Message</td>
              <td style="padding:8px;white-space:pre-line">${message}</td>
            </tr>
          </table>
        </div>
      `,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('contact-form error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to send message' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
