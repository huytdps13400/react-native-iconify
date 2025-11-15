import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const Home = () => {
  return (
    <Layout
      title="React Native Iconify"
      description="Typed, Metro-friendly Iconify integration for React Native, Expo, and Web."
    >
      <main className="hero hero--primary">
        <div className="container">
          <Heading as="h1" className="hero__title">
            React Native Iconify
          </Heading>
          <p className="hero__subtitle">
            Lấy cảm hứng từ Monicon để mang biểu tượng Iconify vào React Native với bundle nhỏ gọn.
          </p>
          <div className="hero__cta">
            <Link className="button button--secondary button--lg" to="/getting-started/react-native">
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Home;

