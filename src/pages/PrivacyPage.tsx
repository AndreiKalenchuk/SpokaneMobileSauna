import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect personal information that you voluntarily provide when using our services:

• Name — to identify you and personalize your experience
• Email address — to send booking confirmations, updates, and respond to inquiries
• Phone number — to coordinate delivery logistics and time-sensitive communications
• Delivery address — to deliver and pick up the mobile sauna at your specified location
• Payment information — to process your rental payment (see Section 3 for details)

We also automatically collect certain technical information when you visit our website, including your IP address, browser type, device type, and pages visited. This data is collected through cookies and used solely for analytics purposes.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

• Process and manage your sauna rental bookings
• Communicate with you about your reservations, including confirmations, reminders, and follow-ups
• Respond to your questions, feedback, and support requests
• Improve our website, services, and customer experience
• Send occasional promotional communications (you may opt out at any time)
• Comply with legal obligations

We do not sell, rent, or trade your personal information to third parties for marketing purposes.`,
  },
  {
    title: '3. Payment Information',
    content: `All payments are processed securely by Stripe, a PCI-DSS compliant payment processor. When you make a payment:

• Your credit card details are transmitted directly to Stripe via their secure, encrypted connection
• We do NOT store your full credit card number, CVV, or other sensitive payment data on our servers
• We retain only a transaction reference ID and the last four digits of your card for record-keeping

For more information about Stripe's security practices, visit stripe.com/privacy.`,
  },
  {
    title: '4. Cookies & Analytics',
    content: `Our website uses cookies for analytics purposes only. Specifically:

• Analytics cookies — We use privacy-focused analytics to understand how visitors interact with our site (page views, traffic sources, device types). This helps us improve the user experience.
• Essential cookies — Minimal cookies required for the website to function properly (e.g., session management).

We do not use advertising cookies or tracking pixels. You can disable cookies in your browser settings, though some website functionality may be affected.`,
  },
  {
    title: '5. Data Sharing',
    content: `We may share your information with trusted third parties only as necessary to provide our services:

• Stripe — for payment processing
• Email service providers — for sending booking confirmations and communications
• Analytics providers — for aggregated, anonymized website usage data

All third-party providers are contractually obligated to protect your information and use it only for the specific purposes we've outlined. We do not share your data with advertisers.`,
  },
  {
    title: '6. Data Retention',
    content: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy:

• Booking records — retained for 3 years for warranty, dispute resolution, and legal compliance
• Contact form submissions — retained for 1 year
• Analytics data — aggregated and anonymized; retained indefinitely

You may request deletion of your personal data at any time by contacting us (see Section 9).`,
  },
  {
    title: '7. Data Security',
    content: `We take reasonable measures to protect your personal information, including:

• SSL/TLS encryption for all data transmitted through our website
• Secure, access-controlled hosting infrastructure
• Limited employee access to personal data on a need-to-know basis
• Regular security reviews of our systems and practices

While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    title: '8. Your Rights',
    content: `Depending on your location, you may have the following rights regarding your personal data:

• Access — request a copy of the personal data we hold about you
• Correction — request that we update or correct inaccurate data
• Deletion — request that we delete your personal data (subject to legal retention requirements)
• Opt-out — unsubscribe from marketing communications at any time

To exercise any of these rights, please contact us using the information in Section 9.`,
  },
  {
    title: '9. Contact Us',
    content: `If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:

Email: hello@mobilesaunarental.com
Phone: (555) 123-4567

We aim to respond to all privacy-related inquiries within 30 days.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. When we make material changes, we will update the "Last updated" date at the top of this page. We encourage you to review this policy periodically.`,
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="How Mobile Sauna Rental collects, uses, and protects your personal information. Read our full privacy policy."
        />
      </Helmet>

      <main className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold md:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-muted-foreground">
              Last updated: March 1, 2026
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              At Mobile Sauna Rental, we respect your privacy and are committed
              to protecting your personal information. This policy explains what
              data we collect, how we use it, and your rights regarding that
              data.
            </p>
          </motion.div>

          <div className="mt-12 space-y-10">
            {sections.map(({ title, content }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="mt-3 whitespace-pre-line text-muted-foreground leading-relaxed">
                  {content}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
