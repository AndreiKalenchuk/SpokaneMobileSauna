import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'

const sections = [
  {
    title: '1. Rental Agreement',
    content: `By completing a booking through our website or contacting us directly, you ("the Renter") agree to enter into a rental agreement with Mobile Sauna Rental ("the Company") for the use of our mobile sauna and/or related equipment. This agreement is binding upon confirmation of your booking and receipt of payment.`,
  },
  {
    title: '2. Booking & Payment Terms',
    content: `A non-refundable deposit of 50% is required at the time of booking to reserve your date. The remaining balance is due 48 hours prior to your scheduled rental date. We accept all major credit cards, processed securely through Stripe. A valid credit card must be on file for all rentals to cover any potential damage or cleaning fees.`,
  },
  {
    title: '3. Cancellation Policy',
    content: `We understand plans change. Our cancellation policy is as follows:

• More than 72 hours before rental: Full refund (minus processing fees)
• 24–72 hours before rental: 50% refund
• Less than 24 hours before rental: No refund

Cancellations must be submitted in writing via email. Rescheduling is available subject to availability and must be requested at least 48 hours in advance. One reschedule per booking is permitted at no additional charge.`,
  },
  {
    title: '4. Delivery & Setup Requirements',
    content: `We deliver, set up, and pick up the sauna at your specified location. The Renter must ensure:

• A flat, level surface (gravel, concrete, or packed earth) of at least 12' × 16'
• Clear vehicle access for our delivery trailer (standard driveway width)
• No overhead obstructions (trees, wires, awnings) within 15 feet of the sauna chimney
• Access to the setup area at the agreed-upon delivery time
• Adequate distance (minimum 10 feet) from structures, fences, and combustible materials

If the delivery location is deemed unsafe or inaccessible by our team, we reserve the right to cancel the rental. In such cases, a 50% refund will be issued.`,
  },
  {
    title: '5. Use of the Sauna',
    content: `The mobile sauna is delivered ready to use with firewood, bucket, ladle, and operating instructions. The Renter agrees to:

• Follow all provided safety and operating instructions
• Never leave the sauna stove unattended while lit
• Not exceed the maximum capacity of 6 persons at any time
• Not use the sauna under the influence of drugs or excessive alcohol
• Not move, tow, or relocate the sauna trailer from its setup position
• Keep the interior clean and free of food, beverages, and glass containers`,
  },
  {
    title: '6. Liability & Damage',
    content: `The Renter assumes full responsibility for the sauna and all equipment from the time of delivery until pickup. The Renter is liable for any damage beyond normal wear and tear, including but not limited to: structural damage, burns, stains, broken fixtures, and missing accessories. Repair or replacement costs will be charged to the credit card on file.

The Renter agrees to indemnify and hold harmless Mobile Sauna Rental, its owners, employees, and agents from any and all claims, damages, losses, and expenses arising from the use of the sauna during the rental period. Use of the sauna is at your own risk.`,
  },
  {
    title: '7. Weather Policy',
    content: `Saunas are designed for all-weather use and rentals proceed rain or shine. In the event of severe weather warnings (thunderstorms with lightning, high winds exceeding 40 mph, or other hazardous conditions), we may delay delivery or offer rescheduling at no additional charge. The Company reserves the right to make this determination for safety purposes.`,
  },
  {
    title: '8. Age Requirement',
    content: `The primary Renter must be at least 18 years of age. Minors may use the sauna only under direct adult supervision at all times. The Renter assumes responsibility for all guests and their compliance with these terms.`,
  },
  {
    title: '9. Prohibited Uses',
    content: `The following uses are strictly prohibited and will result in immediate termination of the rental without refund:

• Using the sauna for any illegal activity
• Subletting or re-renting the sauna to third parties
• Modifying, disassembling, or tampering with any part of the sauna or trailer
• Using the sauna stove for cooking or any purpose other than heating sauna stones
• Bringing pets inside the sauna
• Applying oils, chemicals, or substances to the cedar interior`,
  },
  {
    title: '10. Cleaning Fee',
    content: `The sauna should be returned in a clean condition. A cleaning fee of up to $150 may be applied if the sauna requires excessive cleaning beyond normal use. This includes but is not limited to: spilled beverages, food residue, excessive dirt or mud, or vomit.`,
  },
  {
    title: '11. Dispute Resolution',
    content: `Any disputes arising from this rental agreement shall first be addressed through good-faith negotiation. If unresolved, disputes will be submitted to binding arbitration in accordance with the rules of the American Arbitration Association. These terms are governed by the laws of the state in which the Company operates.

For questions or concerns, please contact us:

Email: hello@mobilesaunarental.com
Phone: (555) 123-4567`,
  },
]

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="Rental terms and conditions for Mobile Sauna Rental. Review our booking, cancellation, liability, and usage policies."
        />
      </Helmet>

      <main className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold md:text-5xl">
              Terms & Conditions
            </h1>
            <p className="mt-4 text-muted-foreground">
              Last updated: March 1, 2026
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
