import styles from "./CategoryCard.module.css";

type CategoryCardProps = {
  image: string;
  title: string;
  onClick: () => void;
};

const categoryIcons: Record<string, string> = {
  "Dairy, Bread & Eggs": "fa-bottle-water",
  "Fruits & Vegetables": "fa-carrot",
  "Cold Drinks & Juices": "fa-martini-glass-citrus",
  "Snacks & Munchies": "fa-cookie-bite",
  "Sweet Tooth": "fa-candy-cane",
  "Tea, Coffee & Milk Drinks": "fa-mug-hot",
  "Chicken, Meat & Fish": "fa-drumstick-bite",
  "Cleaning Essentials": "fa-soap",
};

const CategoryCard = ({ image, title, onClick }: CategoryCardProps) => {
  const icon = categoryIcons[title] ?? "fa-basket-shopping";

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      {image ? (
        <img src={image} alt={title} className={styles.image} />
      ) : (
        <div className={styles.iconBadge} aria-hidden="true">
          <i className={`fa-solid ${icon}`} />
        </div>
      )}

      <h3 className={styles.title}>{title}</h3>
    </button>
  );
};

export default CategoryCard;
