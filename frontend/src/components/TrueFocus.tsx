import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface TrueFocusProps {
    sentence?: string;
    manualMode?: boolean;
    blurAmount?: number;
    borderColor?: string;
    glowColor?: string;
    animationDuration?: number;
    pauseBetweenAnimations?: number;
    onWordSelect?: (index: number) => void;
    selectedIndex?: number;
}

interface FocusRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const TrueFocus: React.FC<TrueFocusProps> = ({
    sentence = "True Focus",
    manualMode = false,
    blurAmount = 5,
    borderColor = "blue",
    glowColor = "rgba(37, 99, 235, 0.6)",
    animationDuration = 0.5,
    pauseBetweenAnimations = 1,
    onWordSelect,
    selectedIndex = 0,
}) => {
    const words = sentence.split(" ");
    const [currentIndex, setCurrentIndex] = useState<number>(selectedIndex);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        console.log('TrueFocus - selectedIndex changed to:', selectedIndex, 'Word:', words[selectedIndex]);
        setCurrentIndex(selectedIndex);
    }, [selectedIndex]);

    useEffect(() => {
        if (!manualMode) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % words.length);
            }, (animationDuration + pauseBetweenAnimations) * 1000);

            return () => clearInterval(interval);
        }
    }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

    useEffect(() => {
        // Use hoveredIndex if hovering, otherwise use currentIndex
        const targetIndex = hoveredIndex !== null ? hoveredIndex : currentIndex;

        if (targetIndex === null || targetIndex === -1) return;
        if (!wordRefs.current[targetIndex] || !containerRef.current) return;

        const updateRect = () => {
            const parentRect = containerRef.current!.getBoundingClientRect();
            const activeRect = wordRefs.current[targetIndex]!.getBoundingClientRect();

            const newRect = {
                x: activeRect.left - parentRect.left,
                y: activeRect.top - parentRect.top,
                width: activeRect.width,
                height: activeRect.height,
            };

            console.log('TrueFocus - Updating focusRect for targetIndex:', targetIndex, 'word:', words[targetIndex], 'isHovered:', hoveredIndex !== null);
            setFocusRect(newRect);
        };

        // Immediate update
        updateRect();

        // Also update after a short delay to ensure DOM is ready
        setTimeout(updateRect, 50);
        setTimeout(updateRect, 100);
    }, [currentIndex, hoveredIndex, words.length]);

    // Initial rect calculation on mount
    useEffect(() => {
        if (wordRefs.current[currentIndex] && containerRef.current) {
            setTimeout(() => {
                const parentRect = containerRef.current!.getBoundingClientRect();
                const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

                setFocusRect({
                    x: activeRect.left - parentRect.left,
                    y: activeRect.top - parentRect.top,
                    width: activeRect.width,
                    height: activeRect.height,
                });
            }, 200);
        }
    }, []);

    const handleMouseEnter = (index: number) => {
        if (manualMode) {
            setHoveredIndex(index);
        }
    };

    const handleMouseLeave = () => {
        if (manualMode) {
            setHoveredIndex(null);
        }
    };

    const handleClick = (index: number) => {
        console.log('TrueFocus - Clicked word index:', index, 'Word:', words[index]);
        // Don't set currentIndex here, let the parent component handle it via selectedIndex prop
        onWordSelect?.(index);
    };

    return (
        <div
            className="relative flex gap-10 justify-center items-center flex-wrap"
            ref={containerRef}
        >
            {words.map((word, index) => {
                const isActive = index === currentIndex;
                const isHovered = index === hoveredIndex;
                const shouldHighlight = isActive || isHovered;

                return (
                    <span
                        key={index}
                        ref={(el) => { wordRefs.current[index] = el; }}
                        className="relative text-2xl md:text-3xl font-medium cursor-pointer hover:scale-105 transition-transform duration-200"
                        style={{
                            filter: manualMode
                                ? shouldHighlight
                                    ? `blur(0px)`
                                    : `blur(${blurAmount}px)`
                                : shouldHighlight
                                    ? `blur(0px)`
                                    : `blur(${blurAmount}px)`,
                            transition: `filter ${animationDuration}s ease`,
                            color: shouldHighlight ? '#2563eb' : '#6b7280',
                        } as React.CSSProperties}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick(index)}
                    >
                        {word}
                    </span>
                );
            })}

            <motion.div
                className="absolute top-0 left-0 pointer-events-none box-border border-0"
                animate={{
                    x: focusRect.x,
                    y: focusRect.y,
                    width: focusRect.width,
                    height: focusRect.height,
                    opacity: currentIndex >= 0 ? 1 : 0,
                }}
                transition={{
                    duration: animationDuration,
                    ease: "easeInOut",
                }}
                style={{
                    "--border-color": borderColor,
                    "--glow-color": glowColor,
                } as React.CSSProperties}
            >
                <span
                    className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] left-[-10px] border-r-0 border-b-0"
                    style={{
                        borderColor: "var(--border-color)",
                        filter: "drop-shadow(0 0 4px var(--border-color))",
                    }}
                ></span>
                <span
                    className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] right-[-10px] border-l-0 border-b-0"
                    style={{
                        borderColor: "var(--border-color)",
                        filter: "drop-shadow(0 0 4px var(--border-color))",
                    }}
                ></span>
                <span
                    className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] left-[-10px] border-r-0 border-t-0"
                    style={{
                        borderColor: "var(--border-color)",
                        filter: "drop-shadow(0 0 4px var(--border-color))",
                    }}
                ></span>
                <span
                    className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] right-[-10px] border-l-0 border-t-0"
                    style={{
                        borderColor: "var(--border-color)",
                        filter: "drop-shadow(0 0 4px var(--border-color))",
                    }}
                ></span>
            </motion.div>
        </div>
    );
};

export default TrueFocus;