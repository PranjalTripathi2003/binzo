import { useEffect, useRef } from "react";
import type { Category } from "../../services/catalog";
import { useProductsQuery } from "../../services/catalog";
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
  const productsQuery = useProductsQuery(category.id);

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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const products = productsQuery.data ?? [];

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
          {productsQuery.isPending ? (
            <p className={styles.message}>Loading products…</p>
          ) : productsQuery.isError ? (
            <p className={styles.message} role="alert">
              Products could not be loaded. Please try again.
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
