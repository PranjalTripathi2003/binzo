import PromoCard from "../PromoCard/PromoCard";
import styles from "./PromoSection.module.css";

type PromoSectionProps = {
  onOpenCategory: (categoryTitle: string) => void;
};

const PromoSection = ({ onOpenCategory }: PromoSectionProps) => {
  return (
    <section className={styles.promoSection}>
      <PromoCard
        title="Pharmacy available at your doorstep"
        description="Cough Syrups, relief sprays & more"
        buttonText="Order Now"
        backgroundColor="#5BAFC6"
        image="/images/promo-card-image-1.png"
        onClick={() => onOpenCategory("Pharmacy")}
      />
      <PromoCard
        title="Petcare supplies available at demand"
        description="Get Petcare supplies at your doorstep"
        buttonText="Order Now"
        backgroundColor="#C92D2F"
        image="/images/promo-card-image-2.png"
        onClick={() => onOpenCategory("Pet Care")}
      />
      <PromoCard
        title="All the latest gadgets available here!"
        description="From phones to laptops. Everything!"
        buttonText="Order Now"
        backgroundColor="#ACA2A2"
        image="/images/promo-card-image-3.png"
        onClick={() => onOpenCategory("Electronics")}
      />
    </section>
  );
};

export default PromoSection;
