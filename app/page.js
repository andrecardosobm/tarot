import SiteHeader from '../components/SiteHeader';
import ReadingFlow from '../components/ReadingFlow';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SiteHeader />
      <ReadingFlow />
    </main>
  );
}
