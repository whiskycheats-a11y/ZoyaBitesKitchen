'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AboutSection from '@/components/AboutSection';

export default function About() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-20">
                <AboutSection />
            </div>
            <Footer />
        </div>
    );
}
