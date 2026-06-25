import Gallery from '@/components/Gallery';

export const metadata = {
  title: 'Gallery | KIO-X',
  description: 'KIO-X Performance Gallery - Elite training sessions, match day highlights and performance moments',
};

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-bg-primary">
      <Gallery />
    </main>
  );
}
