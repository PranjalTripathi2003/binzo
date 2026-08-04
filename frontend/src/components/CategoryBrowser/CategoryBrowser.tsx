import type { Product } from "../../data/products";
import type { Category } from "../../services/catalog";
import ProductCard from "../ProductCard/ProductCard";
import styles from "./CategoryBrowser.module.css";

type CategoryBrowserProps = {
  categories: Category[];
  selectedCategoryId: string;
  selectedCategoryTitle: string;
  onCategorySelect: (categoryId: string) => void;
  products: Product[];
  isLoading: boolean;
};

const CategoryBrowser = ({
  categories,
  selectedCategoryId,
  selectedCategoryTitle,
  onCategorySelect,
  products,
  isLoading,
}: CategoryBrowserProps) => {
  return (
    <section className={styles.browser}>
      <aside className={styles.sidebar}>
        <div className={styles.categoryList}>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.categoryRow} ${
                selectedCategoryId === category.id
                  ? styles.categoryRowActive
                  : ""
              }`}
              onClick={() => onCategorySelect(category.id)}
            >
              <div className={styles.categoryImageWrapper}>
                {category.image ? (
                  <img
                    className={styles.categoryImage}
                    src={category.image}
                    alt={category.title}
                  />
                ) : (
                  <div className={styles.categoryPlaceholder} />
                )}
              </div>
              <span className={styles.categoryTitle}>{category.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h2 className={styles.categoryHeading}>Buy {selectedCategoryTitle} Online</h2>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading products...</div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            No products found for this category.
          </div>
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
  );
};

export default CategoryBrowser;
