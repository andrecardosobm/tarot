import SiteHeader from '../../components/SiteHeader';
import ArcanaBrowser from '../../components/ArcanaBrowser';

export const metadata = { title: 'Dicionário dos 78 arcanos' };

export default function ArcanaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SiteHeader />
      <ArcanaBrowser />
    </main>
  );
}
