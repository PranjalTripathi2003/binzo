import CategoryCard from "../CategoryCard/CategoryCard";
import styles from "./CategoryGrid.module.css";

/**
 * Learning TODO for category filtering:
 * 1. Add an onCategorySelect prop here.
 * 2. Wrap each CategoryCard in a button or make CategoryCard clickable.
 * 3. Pass category.id back to HomePage.
 * 4. In HomePage, call getProducts(categoryId).
 */
type CategoryGridProps = {
  categories: {
    id: string;
    title: string;
    image: string;
  }[];
};

const CategoryGrid = ({ categories }: CategoryGridProps) => {
  return (
    <section className={styles.grid}>
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          title={category.title}
          image={category.image}
        ></CategoryCard>
      ))}
    </section>
  );
};
export default CategoryGrid;
