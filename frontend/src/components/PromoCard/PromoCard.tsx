import styles from "./PromoCard.module.css";

type PromoCardProps = {
  title: string;
  description: string;
  buttonText: string;
  backgroundColor: string;
  image?: string;
};

const PromoCard = ({
  title,
  description,
  buttonText,
  backgroundColor,
  image,
}: PromoCardProps) => {
  return (
    <section className={styles.promoCard} style={{ backgroundColor }}>
      <div className={styles.left}>
        <h2>{title}</h2>
        <p>{description}</p>
        <button>{buttonText}</button>
      </div>

      {image && (
        <div className={styles.right}>
          <img src={image} alt={title} />
        </div>
      )}
    </section>
  );
};

export default PromoCard;
