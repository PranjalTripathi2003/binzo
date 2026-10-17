import CategoryCard from "../CategoryCard/CategoryCard";
import styles from "./CategoryGrid.module.css";

type CategoryGridProps = {
  categories: {
    id: string;
    title: string;
    image: string;
  }[];
  onCategorySelect: (categoryId: string) => void;
};

const CategoryGrid = ({ categories, onCategorySelect }: CategoryGridProps) => {
  return (
    <section className={styles.grid}>
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          title={category.title}
          image={category.image}
          onClick={() => onCategorySelect(category.id)}
        />
      ))}
    </section>
  );
};
export default CategoryGrid;
