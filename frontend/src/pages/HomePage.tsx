import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Footer from "../components/Footer/Footer";
import PromoSection from "../components/PromoSection/PromoSection";
import CategoryGrid from "../components/CategoryGrid/CategoryGrid";
import ProductSection from "../components/ProductSection/ProductSection";

const HomePage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <PromoSection />
      <CategoryGrid />
      <ProductSection />
      <Footer />
    </>
  );
};

export default HomePage;
