import { Helmet } from 'react-helmet-async'
import { SITE_NAME, fullUrl, DEFAULT_OG_IMAGE } from '@/lib/site-config'
import { motion } from 'framer-motion'

const sections = [
  {
    title: '1. Rental Agreement',
    content: `By completing a booking through our website or contacting us directly, you ("the Renter") agree to enter into a binding rental agreement with Mobile Sauna Rental ("the Company") for the use of our mobile wood-burning sauna and/or related equipment. This agreement is binding upon confirmation of your booking and receipt of payment. The Renter must be at least 18 years of age and present at the rental location at all times while the sauna is in use.`,
  },
  {
    title: '2. Booking & Payment Terms',
    content: `A non-refundable deposit of 50% is required at the time of booking to reserve your date. The remaining balance is due 48 hours prior to your scheduled rental date. We accept all major credit cards, processed securely through Stripe. A valid credit card must be on file for all rentals to cover any potential damage, cleaning, or equipment replacement fees.`,
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
    title: '4. Delivery, Setup & Site Requirements',
    content: `We deliver, set up, and pick up the sauna at your specified location. Our staff will start the initial fire and provide a full safety orientation before departure. The Renter must ensure:

• A flat, level surface (gravel, concrete, or packed earth) of at least 12' × 16'
• Clear vehicle access for our delivery trailer (standard driveway width)
• No overhead obstructions (trees, wires, awnings) within 15 feet of the sauna chimney
• Minimum 10-foot clearance from all structures, fences, vehicles, and any combustible materials
• Maximum ground slope of 15%
• Access to the setup area at the agreed-upon delivery time
• The sauna must not be moved, towed, or relocated from its setup position after delivery

If the delivery location is deemed unsafe or inaccessible by our team, we reserve the right to cancel the rental on-site. In such cases, a 50% refund will be issued.`,
  },
  {
    title: '5. Fire Safety & Wood-Burning Stove Operation',
    content: `The mobile sauna is equipped with a wood-burning stove. The Renter acknowledges the inherent fire risks associated with operating a wood-burning stove and agrees to the following:

FIRE PREVENTION
• Never leave the sauna stove unattended while lit or while embers remain hot
• The Renter must read and understand the fire extinguisher instructions provided and know its location at all times
• Only dry, untreated, unpainted natural firewood and small amounts of paper/kindling may be burned in the stove — no garbage, treated lumber, painted wood, or wood containing nails or screws
• The stove door must remain closed at all times except when loading firewood
• Only matches or the provided fire-starting supplies may be used to ignite the fire
• No fire accelerants of any kind (propane, butane, gasoline, diesel, lighter fluid, or any flammable liquids) may be used in or near the sauna at any time
• No smoking, vaping, candles, or open flames of any kind inside the sauna other than the stove itself

CLEARANCE & SURROUNDINGS
• Maintain a minimum 10-foot clearance between the sauna chimney/exterior and all structures, fences, dry vegetation, overhanging branches, vehicles, and combustible materials
• Do not store firewood, kindling, or any combustible materials against the sauna exterior
• Be aware of dry grass, leaves, or debris in the surrounding area and clear them before use
• Do not operate the sauna during a burn ban, red-flag warning, or fire weather advisory issued by local authorities

STOVE OPERATION
• Only use the stove handles to open the stove — all other stove surfaces are extremely hot and will cause burns
• Do not cross or lean over the stove guard barrier
• Only pour fresh water on the sauna stones — no essential oils, alcohol, or other liquids
• Do not pour water on the stove body or chimney pipe as this may cause steam burns and damage
• Do not use the stove for cooking or any purpose other than heating the sauna

AFTER USE
• Ensure the fire is fully extinguished and no hot embers remain before leaving the sauna unattended
• The stove must be cool and free of hot embers at the time of scheduled pickup. If our team arrives to find a hot stove, an additional day's rental fee will be charged
• Do not dispose of ashes outside the stove — our team will handle ash removal

FIRE DAMAGE LIABILITY
• The Renter is fully liable for any fire damage to surrounding property, structures, or land caused by improper use, negligence, or failure to follow these fire safety requirements
• The Renter is responsible for compliance with all local fire codes, burn regulations, and HOA rules applicable to their property
• The Company strongly recommends the Renter verify their homeowner's or renter's insurance covers liability related to wood-burning equipment`,
  },
  {
    title: '6. Health, Safety & Assumption of Risk',
    content: `The Renter acknowledges that sauna use involves inherent health and safety risks. By booking and using the sauna, the Renter voluntarily assumes all risks, including but not limited to:

• Burns from contact with hot surfaces (stove, chimney, stones, steam)
• Slips and falls on wet surfaces in and around the sauna
• Heat-related illness (heat exhaustion, heat stroke, dehydration, fainting)
• Cardiovascular stress from extreme temperature exposure
• Allergic reactions to wood, smoke, or steam
• Exposure to airborne illness in an enclosed, shared environment

MEDICAL RESTRICTIONS
Sauna use is not recommended — and the Company is not liable — if any participant:
• Has heart disease, uncontrolled high blood pressure, or a history of stroke
• Is pregnant or suspects pregnancy (use at your own risk with physician approval)
• Has a respiratory condition such as asthma or COPD
• Has anhidrosis or any condition that impairs the body's ability to regulate temperature
• Has recently undergone surgery or has open wounds
• Is taking medications that affect circulation, blood pressure, or heat sensitivity
• Is feeling ill or has symptoms of infectious disease

Participants with any medical condition should consult their physician before sauna use. The Company is not liable for any adverse health effects.

RECOMMENDED SESSION LIMITS
• Adults (18+): Maximum 20 minutes per session
• Ages 13–17: Maximum 15 minutes per session
• Ages 9–12: Maximum 10 minutes per session
• Ages 5–8: Maximum 5 minutes per session
• Ages 0–4: Maximum 3 minutes per session

Hydrate frequently with water before, during, and after sauna use. Exit the sauna immediately if you feel dizzy, nauseous, or unwell.`,
  },
  {
    title: '7. Sauna Use Rules',
    content: `The Renter and all guests must comply with the following at all times:

• Do not exceed maximum capacity of 6 persons
• No use under the influence of alcohol, recreational drugs, or impairing medications
• No jewelry or metal objects inside the sauna (burn risk)
• No glass, ceramics, or breakable items inside the sauna
• No food or beverages inside the sauna (water bottles permitted)
• No essential oils, aromatherapy substances, or chemicals applied to the cedar interior
• No pets or animals inside the sauna
• No climbing on the sauna roof or trailer (other than use of the stairs)
• No sexual activity
• Do not bring phones or electronics into the sauna — the Company is not liable for heat damage to personal devices
• Keep the interior clean and dry between sessions

To regulate temperature if it becomes too uncomfortable, open the sauna door to allow fresh ventilation. It is recommended to have access to a cold water source for cooling down after sessions.`,
  },
  {
    title: '8. Guest Responsibility & Minors',
    content: `The Renter is responsible for ALL persons who use the sauna during the rental period, including guests not identified at the time of booking. The Renter must:

• Ensure all guests are informed of and comply with these terms and safety rules
• Ensure all guests acknowledge the risks of sauna use
• Ensure minors (under 18) are accompanied and directly supervised by a parent, legal guardian, or responsible adult at all times
• Ensure guests with health conditions or mobility limitations are accompanied by another adult

The Renter assumes all liability for the actions of their guests during the rental period.`,
  },
  {
    title: '9. Liability, Indemnification & Waiver',
    content: `ASSUMPTION OF RISK
The Renter acknowledges that use of a wood-burning mobile sauna involves inherent risks, including but not limited to risk of burns, fire, heat-related illness, slips, falls, and other injuries. The Renter voluntarily assumes all such risks for themselves and their guests.

RELEASE OF LIABILITY
The Renter, on behalf of themselves, their personal representatives, heirs, executors, administrators, and assigns, hereby releases, discharges, and holds harmless Mobile Sauna Rental, its owners, officers, employees, agents, contractors, and affiliates from any and all claims, demands, actions, causes of action, damages, losses, costs, and expenses (including attorney's fees) arising from or related to the use of the sauna during the rental period, including claims arising from the Company's negligence.

INDEMNIFICATION
The Renter agrees to indemnify, defend, and hold harmless Mobile Sauna Rental from and against any and all third-party claims, liabilities, damages, losses, and expenses (including attorney's fees) arising from: (a) the Renter's use of the sauna, (b) any injury or damage to any person or property during the rental period, (c) any breach of this agreement, or (d) the Renter's failure to comply with fire safety requirements, local laws, or these terms.

PROPERTY DAMAGE
The Renter assumes full responsibility for the sauna and all equipment from delivery until pickup. The Renter is liable for any damage beyond normal wear and tear, including but not limited to: structural damage, burns, stains, broken fixtures, missing accessories, and smoke or fire damage. Repair or replacement costs will be charged to the credit card on file.

LIMITATION OF LIABILITY
To the maximum extent permitted by law, the Company's total liability shall not exceed the rental fees paid for the booking in question. The Company is not liable for any indirect, incidental, special, consequential, or punitive damages.`,
  },
  {
    title: '10. Prohibited Uses',
    content: `The following are strictly prohibited and will result in immediate termination of the rental without refund:

• Using the sauna for any illegal activity
• Subletting or re-renting the sauna to third parties
• Modifying, disassembling, or tampering with any part of the sauna, stove, chimney, or trailer
• Using fire accelerants or prohibited substances as described in Section 5
• Operating the sauna during an active burn ban or fire weather advisory
• Moving the sauna from its delivered setup position
• Tampering with trailer locks, hitch, or transport mechanisms
• Any use that creates an unreasonable risk of fire, injury, or property damage`,
  },
  {
    title: '11. Weather Policy',
    content: `Saunas are designed for all-weather use and rentals proceed rain or shine. In the event of severe weather warnings (thunderstorms with lightning, high winds exceeding 40 mph, wildfire smoke advisories, or other hazardous conditions), we may delay delivery or offer rescheduling at no additional charge. The Company reserves the right to make this determination for safety purposes.

The Renter must not operate the sauna during lightning storms or high-wind events due to fire and safety risks.`,
  },
  {
    title: '12. Cleaning Fee',
    content: `The sauna should be returned in a clean condition. A cleaning fee of up to $150 may be applied if the sauna requires excessive cleaning beyond normal use. This includes but is not limited to: spilled beverages, food residue, excessive dirt or mud, vomit, or any substances applied to the cedar interior.`,
  },
  {
    title: '13. Insurance & Local Compliance',
    content: `The Company maintains general liability insurance for its operations. However, this does not cover the Renter's personal liability, property damage caused by the Renter's negligence, or injuries to the Renter's guests.

The Company strongly recommends that the Renter:
• Verify their homeowner's or renter's insurance covers liability related to wood-burning equipment on their property
• Confirm with their local fire department or HOA that wood-burning sauna use is permitted at their location
• Understand and comply with all applicable local fire codes and burn regulations

The Renter is solely responsible for obtaining any required permits or approvals for sauna use at their property.`,
  },
  {
    title: '14. Dispute Resolution & Governing Law',
    content: `Any disputes arising from this rental agreement shall first be addressed through good-faith negotiation. If unresolved within 30 days, disputes will be submitted to binding arbitration in accordance with the rules of the American Arbitration Association. These terms are governed by the laws of the State of Washington.

The prevailing party in any dispute shall be entitled to recover reasonable attorney's fees and costs.

For questions or concerns, please contact us:

Email: hello@mobilesaunarental.com
Phone: (555) 123-4567`,
  },
]

export const rentalTermsSections = sections

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions — {SITE_NAME}</title>
        <meta
          name="description"
          content="Rental terms and conditions for Mobile Sauna Rental. Review our booking, cancellation, fire safety, liability, and usage policies."
        />
        <meta property="og:title" content={`Terms & Conditions — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Rental terms and conditions for Mobile Sauna Rental. Review our booking, cancellation, fire safety, liability, and usage policies."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl('/terms')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl('/terms')} />
      </Helmet>

      <div className="py-16 md:py-24">
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
      </div>
    </>
  )
}
