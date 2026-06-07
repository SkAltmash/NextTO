import React from 'react'
import Hero from '../components/Hero'
import ServicesSection from '../components/ServicesSection'
import { RestaurantsSection } from '../components/RestaurantsSection'
import SpecialsSection from '../components/SpecialsSection'
import CategoriesSection from '../components/CategoriesSection'
import WhatsAppCTA from '../components/WhatsAppCTA'
import WhyChooseUs from '../components/WhyChooseUs'
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
            <SpecialsSection />
            <ServicesSection />
            <CategoriesSection />
            <RestaurantsSection />
            <WhyChooseUs />
            <WhatsAppCTA />
            <Footer />
        </div>
    )
}

export default Home