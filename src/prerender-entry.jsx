import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import PartnerPrivacy from './pages/PartnerPrivacy';
import PrivacyPolicy from './pages/PolicyPrivacy';

// Pages that must be readable without JavaScript (e.g. Google Play policy checks).
export const routes = [
  { path: '/partner-privacy-policy', Component: PartnerPrivacy,
    title: 'NextTo Partner App Privacy Policy | NextTo',
    description: 'Privacy Policy for the NextTo Partner app used by restaurant and shop owners: what data we collect, how we use it, and how to request deletion.' },
  { path: '/privacy-policy', Component: PrivacyPolicy,
    title: 'Privacy Policy | NextTo',
    description: "NextTo's Privacy Policy: learn how we collect, use, and protect your personal information when you use our delivery platform." },
];

export function render(path) {
  const route = routes.find((r) => r.path === path);
  const html = renderToString(
    <HelmetProvider>
      <StaticRouter location={path}>
        <route.Component />
      </StaticRouter>
    </HelmetProvider>
  );
  return { html, title: route.title, description: route.description };
}
