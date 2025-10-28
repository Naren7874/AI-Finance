import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import {
  featuresData,
  howItWorksData,
  statsData,
  testimonialsData,
} from "@/data/landing";
import Link from "next/link";
import HeroSection from "@/components/hero";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-neutral-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-neutral-800">
            Everything you need to manage your finances
          </h2>
          <p className="text-lg text-neutral-600 text-center mb-12 max-w-2xl mx-auto">
            Powerful tools to track, analyze, and optimize your financial health
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map((feature, index) => (
              <Card 
                className="p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300" 
                key={index}
              >
                <CardContent className="space-y-4 pt-4">
                  <div className="text-primary-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-800">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-neutral-800">
            How It Works
          </h2>
          <p className="text-lg text-neutral-600 text-center mb-16 max-w-2xl mx-auto">
            Get started in three simple steps and take control of your finances today
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {howItWorksData.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                  <div className="text-primary-600">
                    {step.icon}
                  </div>
                </div>
                <div className="text-sm font-semibold text-primary-600 mb-2">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-neutral-800">
                  {step.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-neutral-800">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-neutral-600 text-center mb-16 max-w-2xl mx-auto">
            See what our users are saying about their financial transformation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonialsData.map((testimonial, index) => (
              <Card 
                key={index} 
                className="p-6 border border-neutral-200 hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-4">
                  <div className="flex items-center mb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-neutral-800">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    {testimonial.quote}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>      
    </div>
  );
};

export default LandingPage;