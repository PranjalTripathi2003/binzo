import { useRef, useState } from "react";
import type { Product } from "../../data/products";
import styles from "./ProductSection.module.css";
import ProductCard from "../ProductCard/ProductCard";

type ProductSectionProps = {
  products: Product[];
};

const ProductSection = ({ products }: ProductSectionProps) => {
  const rowRef1 = useRef<HTMLDivElement>(null);
  const rowRef2 = useRef<HTMLDivElement>(null);
  const [scrolled1, setScrolled1] = useState(false);
  const [scrolled2, setScrolled2] = useState(false);

  const featuredProducts = products.slice(0, 8);
  const pantryProducts = products.slice(8, 16);
  const secondRowProducts =
    pantryProducts.length > 0 ? pantryProducts : featuredProducts;
  const showFirstRowArrows = featuredProducts.length > 5;
  const showSecondRowArrows = secondRowProducts.length > 5;

  const handleScrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const handleScrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}> Dairy, Bread & Eggs</h2>

      <div className={styles.carouselWrapper}>
        {showFirstRowArrows && scrolled1 && (
          <button
            className={styles.arrowBtnLeft}
            onClick={() => handleScrollLeft(rowRef1)}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}
        <div
          className={styles.productsRow}
          ref={rowRef1}
          onScroll={(e) => setScrolled1((e.currentTarget as HTMLDivElement).scrollLeft > 0)}
        >
          {featuredProducts.map((product) => (
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
        {showFirstRowArrows && (
          <button
            className={styles.arrowBtn}
            onClick={() => handleScrollRight(rowRef1)}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        )}
      </div>
      <h2 className={styles.heading}> Popular Picks</h2>
      <div className={styles.carouselWrapper}>
        {showSecondRowArrows && scrolled2 && (
          <button
            className={styles.arrowBtnLeft}
            onClick={() => handleScrollLeft(rowRef2)}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}
        <div
          className={styles.productsRow}
          ref={rowRef2}
          onScroll={(e) => setScrolled2((e.currentTarget as HTMLDivElement).scrollLeft > 0)}
        >
          {secondRowProducts.map((product) => (
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
        {showSecondRowArrows && (
          <button
            className={styles.arrowBtn}
            onClick={() => handleScrollRight(rowRef2)}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        )}
      </div>
    </section>
  );
};


export default ProductSection;

