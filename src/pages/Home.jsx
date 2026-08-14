import React from 'react'
import Hero from '../components/Hero'
import ServicesSection from '../components/ServicesSection'
import { RestaurantsSection } from '../components/RestaurantsSection'
import SpecialsSection from '../components/SpecialsSection'
import SpecialCategoriesSection from '../components/SpecialCategoriesSection'
import CategoriesSection from '../components/CategoriesSection'
import GrocerySection from '../components/GrocerySection'
import Footer from '../components/Footer'
import SEO from '../components/SEO'

function Home() {
    return (
        <div>
            <SEO
                canonical="/"
                keywords={['home delivery', 'food near me', 'order food online India']}
            />
            <Hero />
            <CategoriesSection />
            <ServicesSection />
            <SpecialsSection />
            <SpecialCategoriesSection />
            <GrocerySection />
            <RestaurantsSection />
            <Footer />
        </div>
    )
}

export default Home