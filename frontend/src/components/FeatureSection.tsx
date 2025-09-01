import React from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

interface FeaturePoint {
  title: string;
  text: string;
}

interface FeatureSectionProps {
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

export const FeatureSection: React.FC<FeatureSectionProps> = ({
  icon: Icon,
  title,
  description,
  points,
  index,
  cta
}) => {
  const isEven = index % 2 === 0;

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          isEven ? "from-primary/5 via-transparent to-transparent" : "from-transparent via-transparent to-primary/5"
        )} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-20" />
      </div>

      <div className="container mx-auto max-w-7xl px-6">
        <div className={cn(
          "grid lg:grid-cols-2 gap-16 lg:gap-24 items-center",
          !isEven && "lg:grid-flow-col-dense"
        )}>
          {/* Content Side */}
          <div className={cn(
            "space-y-8",
            !isEven && "lg:col-start-2"
          )}>
            {/* Icon and Title */}
            <div className="space-y-6">
              <div className="inline-flex">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                  <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-2xl border border-primary/20">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  {title}
                </h2>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            {cta && (
              <div className="pt-4">
                <button
                  onClick={cta.onClick}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 text-base font-medium"
                >
                  {/* Button Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/25" />
                  
                  {/* Button Content */}
                  <span className="relative text-primary-foreground">{cta.text}</span>
                  <svg 
                    className="relative w-5 h-5 text-primary-foreground transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Visual Side */}
          <div className={cn(
            "relative",
            !isEven && "lg:col-start-1"
          )}>
            <div className="relative space-y-4">
              {points.map((point, idx) => (
                <div
                  key={idx}
                  className="group relative"
                  style={{
                    animationDelay: `${idx * 0.1}s`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                  
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                    <div className="flex gap-4">
                      {/* Number Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{(idx + 1).toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {point.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {point.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};