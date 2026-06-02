import React from "react";
import { motion } from "framer-motion";

interface CustomSpinnerProps {
  size?: number;
  className?: string;
}

export default function CustomSpinner({ size = 48, className = "" }: CustomSpinnerProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Outer ring (Left / Counter-clockwise) */}
        <motion.g
          style={{ transformOrigin: "50px 50px" }}
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M 50 10 A 40 40 0 1 1 10 50"
            fill="none"
            stroke="rgba(168, 85, 247, 0.4)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Middle ring (Right / Clockwise) */}
        <motion.g
          style={{ transformOrigin: "50px 50px" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M 50 22 A 28 28 0 1 1 22 50"
            fill="none"
            stroke="rgba(168, 85, 247, 0.7)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Inner ring (Left / Counter-clockwise) */}
        <motion.g
          style={{ transformOrigin: "50px 50px" }}
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M 50 34 A 16 16 0 1 1 34 50"
            fill="none"
            stroke="rgba(168, 85, 247, 1.0)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </motion.g>
      </svg>
    </div>
  );
}
