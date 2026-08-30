import SiteHeader from '../../components/SiteHeader';
import AiSettingsForm from '../../components/AiSettingsForm';

export const metadata = { title: 'Ajustes da leitura por IA' };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <SiteHeader />
      <AiSettingsForm />
    </main>
  );
}
