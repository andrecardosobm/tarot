import SiteHeader from '../../components/SiteHeader';
import JournalList from '../../components/JournalList';

export const metadata = { title: 'Diário de tiragens' };

export default function JournalPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SiteHeader />
      <JournalList />
    </main>
  );
}
