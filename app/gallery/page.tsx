import Gallery from '@/components/Gallery';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Gallery | KIO-X',
  description: 'KIO-X Performance Gallery - Elite training sessions, match day highlights and performance moments',
};

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-[#080808]">
      <Navbar />
      <Gallery />
      <Footer />
    </main>
  );
}
