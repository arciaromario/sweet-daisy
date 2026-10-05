import { Link } from 'react-router';
import { DaisyMark } from '../components/Logo';
import { Seo } from '../components/Seo';

export default function NotFound() {
  return (
    <section className="notfound container">
      <Seo title="Page not found" />
      <meta name="robots" content="noindex" />
      <DaisyMark className="notfound__mark" />
      <span className="eyebrow eyebrow--plain">404</span>
      <h1>This page has been eaten.</h1>
      <p className="lead">The page you’re looking for doesn’t exist — but there’s plenty of cake elsewhere.</p>
      <div className="hero__ctas">
        <Link to="/shop" className="btn">
          Shop Cakes
        </Link>
        <Link to="/" className="btn btn--outline">
          Back home
        </Link>
      </div>
    </section>
  );
}
