import React from "react";
import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";
import Footer from "../components/Footer/Footer";
import ProductCard from "../components/ProductCard/ProductCard";
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
