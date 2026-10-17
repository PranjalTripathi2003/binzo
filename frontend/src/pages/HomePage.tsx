import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Footer from "../components/Footer/Footer";
import PromoSection from "../components/PromoSection/PromoSection";
import CategoryGrid from "../components/CategoryGrid/CategoryGrid";
import CategoryBrowser from "../components/CategoryBrowser/CategoryBrowser";
import ProductSection from "../components/ProductSection/ProductSection";
import CategoryProductsModal from "../components/CategoryProductsModal/CategoryProductsModal";
import { products as mockProducts } from "../data/products";
import {
  getProducts,
  useCategoriesQuery,
  useProductsQuery,
  type Category,
} from "../services/catalog";
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

const homepageCategoryTitles = new Set(
  fallbackCategories.map((category) => category.title),
);

const HomePage = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState("snacks");
  const [selectedCategoryTitle, setSelectedCategoryTitle] =
    useState("Snacks & Munchies");
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(false);
  const [modalCategory, setModalCategory] = useState<Category | null>(null);
  const location = useLocation();
  const categoriesQuery = useCategoriesQuery();
  const productsQuery = useProductsQuery();
  const categoryProductsQuery = useQuery({
    queryKey: ["catalog", "products", { categoryId: selectedCategoryId }],
    queryFn: () => getProducts(selectedCategoryId),
    enabled: showCategoryBrowser,
  });
  const categories = categoriesQuery.data?.length
    ? categoriesQuery.data
    : fallbackCategories;
  const products = productsQuery.data?.length
    ? productsQuery.data
    : productsQuery.isError
      ? mockProducts
      : [];
  const status = productsQuery.isPending
    ? "loading"
    : productsQuery.isError
      ? "error"
      : "ready";
  const closeCategoryModal = useCallback(() => setModalCategory(null), []);
  const openCategoryModal = (categoryTitle: string) => {
    const category = categories.find((item) => item.title === categoryTitle);
    if (category) setModalCategory(category);
  };

  useEffect(() => {
    if (location.pathname === "/") setShowCategoryBrowser(false);
  }, [location.pathname]);

  const loadCategoryProducts = (categoryId: string, title: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryTitle(title);
    setShowCategoryBrowser(true);
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

  const dairyCategoryId = categories.find(
    (category) => category.title === "Dairy, Bread & Eggs",
  )?.id;
  const snacksCategoryId = categories.find(
    (category) => category.title === "Snacks & Munchies",
  )?.id;

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
              setModalCategory(category);
            }
          }}
          products={categoryProductsQuery.data ?? []}
          isLoading={categoryProductsQuery.isPending}
        />
      ) : (
        <main className={styles.homeMain}>
          <Hero onShopNow={handleShopNow} />
          <PromoSection onOpenCategory={openCategoryModal} />
          {status === "loading" && (
            <p className={styles.catalogStatus}>Loading product catalog...</p>
          )}
          {status === "error" && (
            <p className={styles.catalogStatus}>
              Backend catalog is unavailable, showing sample products.
            </p>
          )}
          <CategoryGrid
            categories={categories.filter((category) =>
              homepageCategoryTitles.has(category.title),
            )}
            onCategorySelect={(categoryId) => {
              const category = categories.find((item) => item.id === categoryId);
              if (category) setModalCategory(category);
            }}
          />
          {status !== "loading" && (
            <ProductSection
              products={products}
              dairyCategoryId={dairyCategoryId}
              snacksCategoryId={snacksCategoryId}
            />
          )}
        </main>
      )}
      <Footer />
      {modalCategory && (
        <CategoryProductsModal
          key={modalCategory.id}
          category={modalCategory}
          onClose={closeCategoryModal}
        />
      )}
    </>
  );
};

export default HomePage;
