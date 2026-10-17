import { useEffect, useRef, useState } from "react";
import type { Category } from "../../services/catalog";
import { getProducts } from "../../services/catalog";
import type { Product } from "../../data/products";
import ProductCard from "../ProductCard/ProductCard";
import styles from "./CategoryProductsModal.module.css";

type CategoryProductsModalProps = {
  category: Category;
  onClose: () => void;
};

const CategoryProductsModal = ({
  category,
  onClose,
}: CategoryProductsModalProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    let isMounted = true;
    getProducts(category.id)
      .then((loadedProducts) => {
        if (isMounted) setProducts(loadedProducts);
      })
      .catch((loadError: unknown) => {
        console.error(loadError);
        if (isMounted) setError("Products could not be loaded. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [category.id, onClose]);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-products-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="category-products-title">{category.title}</h2>
            <p>Shop products in this category</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close category products"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </header>

        <div className={styles.content}>
          {isLoading ? (
            <p className={styles.message}>Loading products…</p>
          ) : error ? (
            <p className={styles.message} role="alert">
              {error}
            </p>
          ) : products.length === 0 ? (
            <p className={styles.message}>No products in this category yet.</p>
          ) : (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  variantId={product.units[0].id}
                  title={product.title}
                  quantity={product.units[0].size}
                  price={product.units[0].price}
                  image={product.image}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryProductsModal;
