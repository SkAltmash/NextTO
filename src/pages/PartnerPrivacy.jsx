import { Shield, Mail, ChevronRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const CONTACT_EMAIL = 'rudrakshmakre@gmail.com';

// NOTE: rendered to static HTML at build time (scripts/prerender.mjs) so crawlers
// such as Google Play's policy check can read the text without running JavaScript.
// Keep this page free of animation libraries and effects that hide content on first render.
const sections = [
  {
    title: 'Information We Collect',
    list: [
      'Account information: your mobile phone number, used to sign you in with a one-time password (OTP), and the name, email and phone number registered for your partner account.',
      'Store information you provide: store name, address, phone number, delivery time, store type, opening status, menu items (names, descriptions, prices, categories, stock status) and the images you upload (logo, banners and product photos).',
      "Order information: orders placed with your store, including items, amounts, order status, notes, the customer's name as shown on the order, and delivery partner details, so you can prepare and track orders.",
      'Notification and device information: a device push token and an identifier that links your device to your partner account, so we can send you new-order alerts.',
      'Photos you choose: the app asks for gallery access only when you choose to upload an image. We receive only the images you select.',
    ],
    after: 'We do not collect your location, contacts, microphone or camera data.',
  },
  {
    title: 'How We Use Your Information',
    list: [
      'To verify who you are and let you sign in.',
      'To show and manage your store, menu, banners and orders.',
      'To send new-order and order-status notifications.',
      'To calculate settlements and earnings.',
      'To keep the service secure and fix problems.',
    ],
  },
  {
    title: 'Services That Process Data for Us',
    list: [
      'Google Firebase (Authentication, Firestore database and Storage) stores account, store, order and image data.',
      'OneSignal delivers push notifications.',
      '2Factor sends OTP text messages to your phone number.',
    ],
    after:
      'These providers process data only to provide their service to us. We do not sell your personal information and we do not use it for advertising.',
  },
  {
    title: 'Sharing',
    content:
      "Your store name, menu, images and banners are shown to NextTo customers. Order details are shared with the delivery partner assigned to the order. We share information with authorities only if the law requires it.",
  },
  {
    title: 'Security and Retention',
    content:
      'Data is sent over encrypted connections and stored with the providers listed above. We keep your information while your partner account is active and for as long as needed for orders, settlements, accounting and legal obligations.',
  },
  {
    title: 'Your Choices and Deletion',
    content:
      'You can edit your store details, menu and images in the app at any time. You can turn new-order sound alerts off in Settings and turn push notifications off in your phone settings. To request a copy of your data, or to delete your partner account and associated data, email us at the address below. We will respond within 30 days, except for records we must keep by law.',
  },
  {
    title: 'Children',
    content:
      'The app is for business owners and staff. We do not knowingly collect information from children under 13.',
  },
  {
    title: 'Changes to This Policy',
    content:
      'We may update this policy. The effective date at the top shows when it last changed.',
  },
];

export default function PartnerPrivacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">
      <SEO
        title="NextTo Partner App Privacy Policy"
        description="Privacy Policy for the NextTo Partner app used by restaurant and shop owners: what data we collect, how we use it, and how to request deletion."
        canonical="/partner-privacy-policy"
        keywords={['partner app privacy policy', 'NextTo Partner']}
      />

      <div className="relative bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center shrink-0">
              <Shield size={20} className="text-orange-500" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link to="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link>
              <ChevronRight size={12} />
              <span className="text-slate-600">Partner App</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            NextTo Partner App Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm font-semibold mt-2">
            Effective date: <span className="text-slate-500">3 November 2026</span>
          </p>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-4 leading-relaxed max-w-xl">
            This policy applies to the NextTo Partner mobile app (package name com.sk_altamash18.PartnerApp), used by approved restaurant, cafe and shop partners. It is not intended for customers or children. For the NextTo customer app and website, see our{' '}
            <Link to="/privacy-policy" className="text-orange-600 font-bold hover:underline">main Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        {sections.map((sec) => (
          <section
            key={sec.title}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7"
          >
            <h2 className="text-base sm:text-lg font-black text-slate-900 mb-3">{sec.title}</h2>
            {sec.content && (
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{sec.content}</p>
            )}
            {sec.list && (
              <ul className="space-y-2">
                {sec.list.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-semibold text-slate-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {sec.after && (
              <p className="text-slate-500 text-sm font-medium leading-relaxed mt-3">{sec.after}</p>
            )}
          </section>
        ))}

        <section className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl border border-orange-100 p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle size={17} className="text-orange-500" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">Contact Us</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">
            Questions about this policy, or requests to access or delete your data:
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 bg-white border border-orange-200 text-orange-600 font-black text-sm px-4 py-2.5 rounded-2xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
          >
            <Mail size={15} />
            {CONTACT_EMAIL}
          </a>
        </section>
      </div>
    </div>
  );
}
