"use client";

import React, { useEffect, useState, useRef } from "react";

export default function ScrollGlider() {
  const [boundaries, setBoundaries] = useState<number[]>([800, 1800, 2600, 3400, 3800]);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  
  const targetScrollY = useRef(0);
  const currentScrollY = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const calculatePath = () => {
      const container = document.getElementById("main-grid-container");
      const hero = document.getElementById("hero-section");
      const workspace = document.getElementById("workspace-section");
      const features = document.getElementById("features-section");
      const integration = document.getElementById("integration-section");
      const footer = document.getElementById("footer-section");

      const cRect = container ? container.getBoundingClientRect() : null;
      const W = cRect ? cRect.width : 1200;
      setContainerWidth(W);

      // Vertical offsets relative to the main container top, with fallback presets
      const y1 = (hero && cRect) ? (hero.getBoundingClientRect().bottom - cRect.top) : 800;
      const y2 = (workspace && cRect) ? (workspace.getBoundingClientRect().bottom - cRect.top) : 1800;
      const y3 = (features && cRect) ? (features.getBoundingClientRect().bottom - cRect.top) : 2600;
      const y4 = (integration && cRect) ? (integration.getBoundingClientRect().bottom - cRect.top) : 3400;
      const y5 = (footer && cRect) ? (footer.getBoundingClientRect().bottom - cRect.top) : 3800;

      setBoundaries([y1, y2, y3, y4, y5]);

      // Returns true only if all DOM elements are successfully found
      return !!(container && hero && workspace && features && integration && footer);
    };

    // Initial attempt
    const fullyLoaded = calculatePath();
    
    // Polling retry mechanism to update fallback coordinates as soon as hydration completes
    const interval = setInterval(() => {
      const success = calculatePath();
      if (success) {
        clearInterval(interval);
      }
    }, 200);

    const handleResize = () => {
      calculatePath();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      targetScrollY.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial scroll check

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (boundaries.length === 0 || containerWidth === 0) return;

    const y5 = boundaries[4]; // Bottom Y

    const animate = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      // Smooth scroll lerping for glider inertia
      currentScrollY.current += (targetScrollY.current - currentScrollY.current) * 0.085;
      const sY = Math.min(Math.max(currentScrollY.current, 0), maxScroll);

      // Lock X coordinate to the left border
      const newX = 0;
      
      // Calculate Y coordinate based on scroll progress
      const progress = sY / maxScroll;
      const newY = Math.min(Math.max(progress * y5, 0), y5);

      setPosition({ x: newX, y: newY });

      // Update trail points buffer
      setTrail((prev) => {
        const next = [...prev, { x: newX, y: newY }];
        if (next.length > 18) {
          next.shift();
        }
        return next;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [boundaries, containerWidth]);

  const W = containerWidth;
  const y1 = boundaries[0];
  const y2 = boundaries[1];
  const y3 = boundaries[2];
  const y4 = boundaries[3];

  const dividers = [y1, y2, y3, y4];

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {/* Defs placed strictly at the top of the SVG node */}
        <defs>
          <linearGradient id="bleed-glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#6366F1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
          <filter id="glow-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render Bleeding Glowing Horizontal Lines */}
        {dividers.map((divY, idx) => {
          const distance = Math.abs(position.y - divY);
          // Light up when the ball is within 220px vertically of the divider line
          const bleedOpacity = Math.max(0, 1 - distance / 220);

          if (bleedOpacity <= 0) return null;

          // Propagate the glow horizontally as the ball approaches
          const currentLineWidth = bleedOpacity * W;

          return (
            <g key={idx}>
              {/* Outer soft ambient glow */}
              <line
                x1="0"
                y1={divY}
                x2={currentLineWidth}
                y2={divY}
                stroke="url(#bleed-glow-grad)"
                strokeWidth="4"
                filter="url(#glow-blur)"
                opacity={bleedOpacity * 0.5}
              />
              {/* Inner core bleeding line */}
              <line
                x1="0"
                y1={divY}
                x2={currentLineWidth}
                y2={divY}
                stroke="url(#bleed-glow-grad)"
                strokeWidth="1.5"
                opacity={bleedOpacity * 0.9}
              />
            </g>
          );
        })}

        {/* Render trail segments (locked on x = 0) */}
        {trail.map((p, index) => {
          if (index === 0) return null;
          const prev = trail[index - 1];
          const opacity = index / trail.length;
          return (
            <line
              key={index}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke="#6366F1"
              strokeWidth={1 + opacity * 2.5}
              strokeLinecap="round"
              opacity={opacity * 0.75}
            />
          );
        })}

        {/* Glider Orb (Constant size, clean and stable) */}
        <circle
          cx={position.x}
          cy={position.y}
          r="4"
          fill="#FFFFFF"
          stroke="#6366F1"
          strokeWidth="2"
          className="drop-shadow-[0_0_4px_rgba(99,102,241,0.7)]"
        />
      </svg>
    </div>
  );
}
