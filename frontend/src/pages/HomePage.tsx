import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Footer from "../components/Footer/Footer";
import PromoSection from "../components/PromoSection/PromoSection";
import CategoryGrid from "../components/CategoryGrid/CategoryGrid";
import CategoryBrowser from "../components/CategoryBrowser/CategoryBrowser";
import ProductSection from "../components/ProductSection/ProductSection";
import { products as mockProducts } from "../data/products";
import { getCategories, getProducts, type Category } from "../services/catalog";
import styles from "./HomePage.module.css";

const fallbackCategories: Category[] = [
  {
    id: "dairy",
    title: "Dairy, Bread & Eggs",
    image: "/images/dairy-bread-eggs.png",
  },
  {
    id: "fruits",
    title: "Fruits & Vegetables",
    image: "/images/fruits-and-vegetables.png",
  },
  {
    id: "drinks",
    title: "Cold Drinks & Juices",
    image: "/images/cold-drink-and-juices.png",
  },
  {
    id: "snacks",
    title: "Snacks & Munchies",
    image: "/images/snack-and-munchies.png",
  },
  { id: "sweets", title: "Sweet Tooth", image: "/images/sweet-tooth.png" },
  {
    id: "tea",
    title: "Tea, Coffee & Milk Drinks",
    image: "/images/tea-coffee-milk.png",
  },
  {
    id: "meat",
    title: "Chicken, Meat & Fish",
    image: "/images/chicken-meat-fish.png",
  },
  {
    id: "cleaning",
    title: "Cleaning Essentials",
    image: "/images/cleaning-essentials.png",
  },
];

const HomePage = () => {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [products, setProducts] = useState(mockProducts);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState("snacks");
  const [selectedCategoryTitle, setSelectedCategoryTitle] =
    useState("Snacks & Munchies");
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      setShowCategoryBrowser(false);
    }
    let isMounted = true;

    async function loadCatalog() {
      try {
        const [loadedCategories, loadedProducts] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);

        if (!isMounted) {
          return;
        }

        const resolvedCategories =
          loadedCategories.length > 0 ? loadedCategories : fallbackCategories;
        setCategories(resolvedCategories);
        setStatus("ready");

        if (loadedProducts.length > 0) {
          setProducts(loadedProducts);
        } else {
          setProducts(mockProducts);
        }
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

  const loadCategoryProducts = async (categoryId: string, title: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryTitle(title);
    setShowCategoryBrowser(true);

    try {
      setStatus("loading");
      const filteredProducts = await getProducts(categoryId);
      setProducts(filteredProducts);
      setStatus("ready");
    } catch (error) {
      console.error(error);
      setProducts([]);
      setStatus("error");
    }
  };

  const handleShopNow = () => {
    const snacksCategory = categories.find(
      (category) => category.title === "Snacks & Munchies",
    );

    if (snacksCategory) {
      loadCategoryProducts(snacksCategory.id, snacksCategory.title);
    } else {
      setShowCategoryBrowser(true);
    }
  };

  return (
    <>
      <Navbar onLogoClick={() => setShowCategoryBrowser(false)} />
      {showCategoryBrowser ? (
        <CategoryBrowser
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          selectedCategoryTitle={selectedCategoryTitle}
          onCategorySelect={(id) => {
            const category = categories.find((cat) => cat.id === id);
            if (category) {
              loadCategoryProducts(id, category.title);
            }
          }}
          products={products}
          isLoading={status === "loading"}
        />
      ) : (
        <main className={styles.homeMain}>
          <Hero onShopNow={handleShopNow} />
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
        </main>
      )}
      <Footer />
    </>
  );
};

export default HomePage;
