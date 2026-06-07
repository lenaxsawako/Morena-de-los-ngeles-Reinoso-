import SEO from '../../components/SEO';
import HomePage from "./HomePage";

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://morenareinoso.com';

export default function Home() {
  return (
    <>
      <SEO
        title="Libros de Morena Reinoso"
        description="Poesía romántica de Morena Reinoso. Te espero en todas mis estaciones y más."
        url={SITE_URL}
      />
      <HomePage />
    </>
  );
}