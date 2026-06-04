import React from 'react'
import Hero from '../components/Hero'
import ServicesSection from '../components/ServicesSection'
import { RestaurantsSection } from '../components/RestaurantsSection'
import SpecialsSection from '../components/SpecialsSection'
import CategoriesSection from '../components/CategoriesSection'
import WhatsAppCTA from '../components/WhatsAppCTA'
import WhyChooseUs from '../components/WhyChooseUs'
import Footer from '../components/Footer'

function Home() {
    return (
        <div>
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