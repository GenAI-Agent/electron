import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

interface FeaturePoint {
  title: string;
  text: string;
}

interface ModernFeatureSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  points: FeaturePoint[];
  index: number;
  cta?: {
    text: string;
    onClick: () => void;
  };
}

export const ModernFeatureSection: React.FC<ModernFeatureSectionProps> = ({
  icon: Icon,
  title,
  description,
  points,
  index,
  cta
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      <div className="container mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className={cn(
          "text-center mb-20 space-y-6 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <div className="inline-flex">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors duration-300" />
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-5 rounded-3xl border border-primary/30">
                <Icon className="w-10 h-10 text-primary" />
              </div>
            </div>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-bold text-foreground">
            {title}
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {points.map((point, idx) => (
            <div
              key={idx}
              className={cn(
                "group relative transition-all duration-700",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
              style={{
                transitionDelay: `${idx * 150 + 300}ms`
              }}
            >
              {/* Card Glow Effect */}
              <div className="absolute -inset-px bg-gradient-to-r from-primary/50 to-primary/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Card Content */}
              <div className="relative h-full bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                {/* Step Number */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-6xl font-bold text-primary/20">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
                
                {/* Text Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">
                    {point.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {point.text}
                  </p>
                </div>

                {/* Hover Accent Line */}
                <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        {cta && (
          <div className={cn(
            "text-center transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
          style={{ transitionDelay: '900ms' }}
          >
            <button
              onClick={cta.onClick}
              className="group relative inline-flex items-center gap-4"
            >
              {/* Button Glow */}
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Button */}
              <div className="relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-primary/90 rounded-2xl text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <span className="text-lg">{cta.text}</span>
                <svg 
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};