import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon, ChevronRight, Sparkles } from 'lucide-react';

interface FeaturePoint {
  title: string;
  text: string;
}

interface BentoFeatureSectionProps {
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

export const BentoFeatureSection: React.FC<BentoFeatureSectionProps> = ({
  icon: Icon,
  title,
  description,
  points,
  index,
  cta
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const isDark = index % 2 === 1;

  return (
    <section className={cn(
      "relative py-24 lg:py-32 overflow-hidden",
      isDark && "bg-muted/30"
    )}>
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        {/* Mesh Gradient */}
        <div className={cn(
          "absolute inset-0",
          isDark 
            ? "bg-[radial-gradient(at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
            : "bg-[radial-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
        )} />
      </div>

      <div className="container mx-auto max-w-7xl px-6">
        {/* Bento Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Content Card */}
          <div className="lg:col-span-7 group">
            <div className="relative h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 lg:p-12 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl">
              {/* Decorative Elements */}
              <div className="absolute top-8 right-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl" />
                  <Icon className="relative w-16 h-16 text-primary/20" />
                </div>
              </div>

              {/* Content */}
              <div className="relative space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Feature {(index + 1).toString().padStart(2, '0')}</span>
                </div>

                <div className="space-y-4 max-w-xl">
                  <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                    {title}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>

                {cta && (
                  <div className="pt-6">
                    <button
                      onClick={cta.onClick}
                      className="group/btn relative inline-flex items-center gap-3"
                    >
                      <span className="text-lg font-medium text-foreground group-hover/btn:text-primary transition-colors">
                        {cta.text}
                      </span>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover/btn:bg-primary/20 transition-colors">
                        <ChevronRight className="w-5 h-5 text-primary transition-transform group-hover/btn:translate-x-1" />
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Animated Corner Accent */}
              <div className="absolute bottom-0 left-0 w-32 h-32">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-tl-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            </div>
          </div>

          {/* Feature Points Grid */}
          <div className="lg:col-span-5 grid grid-rows-3 gap-6">
            {points.map((point, idx) => (
              <div
                key={idx}
                className="group relative"
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={cn(
                  "relative h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 transition-all duration-300",
                  hoveredCard === idx ? "border-primary/50 shadow-xl scale-105" : "hover:border-primary/30"
                )}>
                  {/* Card Number */}
                  <div className="flex items-start justify-between mb-3">
                    <span className={cn(
                      "text-5xl font-bold transition-colors duration-300",
                      hoveredCard === idx ? "text-primary/40" : "text-primary/10"
                    )}>
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <Sparkles className={cn(
                      "w-5 h-5 transition-all duration-300",
                      hoveredCard === idx ? "text-primary scale-110" : "text-primary/30"
                    )} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                      {point.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {point.text}
                    </p>
                  </div>

                  {/* Hover Effect */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl transition-opacity duration-300",
                    hoveredCard === idx ? "opacity-100" : "opacity-0"
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};