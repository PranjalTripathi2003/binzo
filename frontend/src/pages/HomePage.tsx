import { useEffect, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Footer from "../components/Footer/Footer";
import PromoSection from "../components/PromoSection/PromoSection";
import CategoryGrid from "../components/CategoryGrid/CategoryGrid";
import ProductSection from "../components/ProductSection/ProductSection";
import { products as mockProducts } from "../data/products";
import { getCategories, getProducts, type Category } from "../services/catalog";
import styles from "./HomePage.module.css";

const fallbackCategories: Category[] = [
  { id: "dairy", title: "Dairy, Bread & Eggs", image: "" },
  { id: "fruits", title: "Fruits & Vegetables", image: "" },
  { id: "drinks", title: "Cold Drinks & Juices", image: "" },
  { id: "snacks", title: "Snacks & Munchies", image: "" },
  { id: "sweets", title: "Sweet Tooth", image: "" },
  { id: "tea", title: "Tea, Coffee & Milk Drinks", image: "" },
  { id: "meat", title: "Chicken, Meat & Fish", image: "" },
  { id: "cleaning", title: "Cleaning Essentials", image: "" },
];

const HomePage = () => {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [products, setProducts] = useState(mockProducts);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let isMounted = true;

    /**
     * Learning TODO for category filtering:
     * This currently loads all products once.
     *
     * Next version:
     * 1. Add selectedCategoryId state.
     * 2. Pass setSelectedCategoryId into CategoryGrid.
     * 3. When selectedCategoryId changes, call getProducts(selectedCategoryId).
     * 4. Keep this fallback behavior for when the backend is unavailable.
     */
    async function loadCatalog() {
      try {
        const [loadedCategories, loadedProducts] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(
          loadedCategories.length > 0 ? loadedCategories : fallbackCategories,
        );
        setProducts(loadedProducts.length > 0 ? loadedProducts : mockProducts);
        setStatus("ready");
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Navbar />
      <Hero />
      <PromoSection />
      {status === "loading" && (
        <p className={styles.catalogStatus}>Loading fresh picks...</p>
      )}
      {status === "error" && (
        <p className={styles.catalogStatus}>
          Backend catalog is unavailable, showing sample products.
        </p>
      )}
      <CategoryGrid categories={categories} />
      <ProductSection products={products} />
      <Footer />
    </>
  );
};

export default HomePage;
