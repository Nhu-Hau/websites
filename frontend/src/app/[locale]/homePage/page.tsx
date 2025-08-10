'use client';
import AboutSection from "./components/AboutSection";
import Banner from "./components/Banner";
import BenefitsSection from "./components/BenefitSection";
import UserReviews from "./components/UserReviews";

export default function HomePage() {

  return (
    <>
      <Banner />
      <BenefitsSection />
      <AboutSection />
      <UserReviews />
    </>
  );
}
