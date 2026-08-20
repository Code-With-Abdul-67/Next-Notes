"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface NitroTheme {
  id: string;
  name: string;
  category: "gradient" | "dark" | "retro" | "cyberpunk" | "nature";
  description: string;
  previewColors: string[];
  bgPrimary: string;
  bgSecondary: string;
  bgRadial: string;
  accent: string;
  accentGlow: string;
  cardBg: string;
  cardBorder: string;
  glassPanelBg: string;
  textPrimary: string;
  textMuted: string;
}

export const NITRO_THEMES: NitroTheme[] = [
  {
    id: "default-blurple",
    name: "Midnight Blurple",
    category: "gradient",
    description: "The signature Discord Nitro blurple with deep midnight obsidian tones",
    previewColors: ["#5865F2", "#8B5CF6", "#040209"],
    bgPrimary: "#040209",
    bgSecondary: "#0e091e",
    bgRadial: "radial-gradient(at 0% 0%, rgba(88, 101, 242, 0.20) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.20) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(20, 10, 40, 0.6) 0px, transparent 70%)",
    accent: "#5865F2",
    accentGlow: "rgba(88, 101, 242, 0.35)",
    cardBg: "rgba(255, 255, 255, 0.03)",
    cardBorder: "rgba(88, 101, 242, 0.20)",
    glassPanelBg: "rgba(15, 10, 25, 0.55)",
    textPrimary: "#F4F2F7",
    textMuted: "rgba(244, 242, 247, 0.5)",
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    category: "cyberpunk",
    description: "High-voltage neon cyan and electric lime against pitch-black void",
    previewColors: ["#00F2FE", "#4FACFE", "#020B14"],
    bgPrimary: "#020912",
    bgSecondary: "#041726",
    bgRadial: "radial-gradient(at 0% 0%, rgba(0, 242, 254, 0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(79, 172, 254, 0.22) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(2, 25, 45, 0.5) 0px, transparent 70%)",
    accent: "#00F2FE",
    accentGlow: "rgba(0, 242, 254, 0.4)",
    cardBg: "rgba(0, 242, 254, 0.02)",
    cardBorder: "rgba(0, 242, 254, 0.25)",
    glassPanelBg: "rgba(2, 16, 28, 0.6)",
    textPrimary: "#E0F7FF",
    textMuted: "rgba(224, 247, 255, 0.5)",
  },
  {
    id: "sunset-vaporwave",
    name: "Sunset Vaporwave",
    category: "gradient",
    description: "Warm tropical sunset fading into magenta neon twilight",
    previewColors: ["#FF416C", "#FF4B2B", "#1A081A"],
    bgPrimary: "#0D0311",
    bgSecondary: "#1E061E",
    bgRadial: "radial-gradient(at 0% 0%, rgba(255, 65, 108, 0.20) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(255, 75, 43, 0.20) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(35, 8, 35, 0.5) 0px, transparent 70%)",
    accent: "#FF416C",
    accentGlow: "rgba(255, 65, 108, 0.35)",
    cardBg: "rgba(255, 65, 108, 0.03)",
    cardBorder: "rgba(255, 65, 108, 0.22)",
    glassPanelBg: "rgba(22, 6, 22, 0.6)",
    textPrimary: "#FFF0F4",
    textMuted: "rgba(255, 240, 244, 0.5)",
  },
  {
    id: "sakura-blossom",
    name: "Sakura Blossom",
    category: "nature",
    description: "Soft ethereal cherry blossom pinks on velvet night",
    previewColors: ["#F67280", "#C06C84", "#120B13"],
    bgPrimary: "#0E0710",
    bgSecondary: "#1A0E1C",
    bgRadial: "radial-gradient(at 0% 0%, rgba(246, 114, 128, 0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(192, 108, 132, 0.22) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(30, 14, 30, 0.5) 0px, transparent 70%)",
    accent: "#F67280",
    accentGlow: "rgba(246, 114, 128, 0.35)",
    cardBg: "rgba(246, 114, 128, 0.03)",
    cardBorder: "rgba(246, 114, 128, 0.20)",
    glassPanelBg: "rgba(20, 10, 22, 0.6)",
    textPrimary: "#FFE8EE",
    textMuted: "rgba(255, 232, 238, 0.5)",
  },
  {
    id: "emerald-matrix",
    name: "Emerald Forest",
    category: "nature",
    description: "Deep lush forest emerald and glowing radioactive mint",
    previewColors: ["#10B981", "#059669", "#02120A"],
    bgPrimary: "#020D07",
    bgSecondary: "#041A0E",
    bgRadial: "radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(5, 150, 105, 0.20) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(3, 30, 15, 0.5) 0px, transparent 70%)",
    accent: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.35)",
    cardBg: "rgba(16, 185, 129, 0.03)",
    cardBorder: "rgba(16, 185, 129, 0.22)",
    glassPanelBg: "rgba(3, 20, 12, 0.6)",
    textPrimary: "#ECFDF5",
    textMuted: "rgba(236, 253, 245, 0.5)",
  },
  {
    id: "crimson-abyss",
    name: "Crimson Abyss",
    category: "dark",
    description: "Fierce blood red and scarlet embers inside deep dark shadows",
    previewColors: ["#EF4444", "#991B1B", "#120202"],
    bgPrimary: "#0B0202",
    bgSecondary: "#1A0404",
    bgRadial: "radial-gradient(at 0% 0%, rgba(239, 68, 68, 0.20) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(153, 27, 27, 0.22) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(35, 5, 5, 0.5) 0px, transparent 70%)",
    accent: "#EF4444",
    accentGlow: "rgba(239, 68, 68, 0.35)",
    cardBg: "rgba(239, 68, 68, 0.03)",
    cardBorder: "rgba(239, 68, 68, 0.25)",
    glassPanelBg: "rgba(22, 4, 4, 0.6)",
    textPrimary: "#FEF2F2",
    textMuted: "rgba(254, 242, 242, 0.5)",
  },
  {
    id: "amoled-pitch",
    name: "AMOLED Pure Black",
    category: "dark",
    description: "Ultra-crisp 100% pure black with minimalist clean silver accents",
    previewColors: ["#FFFFFF", "#71717A", "#000000"],
    bgPrimary: "#d7d7d7",
    bgSecondary: "#050505",
    bgRadial: "radial-gradient(at 50% 0%, rgba(255, 255, 255, 0.04) 0px, transparent 60%)",
    accent: "#ff00b3",
    accentGlow: "rgba(255, 255, 255, 0.2)",
    cardBg: "rgba(255, 255, 255, 0.02)",
    cardBorder: "rgba(255, 255, 255, 0.10)",
    glassPanelBg: "rgba(8, 8, 8, 0.8)",
    textPrimary: "#000000",
    textMuted: "#A1A1AA",
  },
  {
    id: "solar-amber",
    name: "Solar Gold",
    category: "gradient",
    description: "Warm molten amber and luxury radiant gold glow",
    previewColors: ["#F59E0B", "#D97706", "#140D02"],
    bgPrimary: "#0D0801",
    bgSecondary: "#1C1103",
    bgRadial: "radial-gradient(at 0% 0%, rgba(245, 158, 11, 0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(217, 119, 6, 0.20) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(35, 20, 4, 0.5) 0px, transparent 70%)",
    accent: "#F59E0B",
    accentGlow: "rgba(245, 158, 11, 0.35)",
    cardBg: "rgba(245, 158, 11, 0.03)",
    cardBorder: "rgba(245, 158, 11, 0.22)",
    glassPanelBg: "rgba(20, 12, 3, 0.6)",
    textPrimary: "#FFFBEB",
    textMuted: "rgba(255, 251, 235, 0.5)",
  },
  {
    id: "retro-synthwave",
    name: "Retro Synthwave",
    category: "retro",
    description: "Outrun 80s arcade neon purple, vivid hot pink and laser grid vibe",
    previewColors: ["#EC4899", "#8B5CF6", "#090214"],
    bgPrimary: "#090214",
    bgSecondary: "#16052B",
    bgRadial: "radial-gradient(at 0% 0%, rgba(236, 72, 153, 0.22) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.25) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(30, 7, 55, 0.6) 0px, transparent 70%)",
    accent: "#EC4899",
    accentGlow: "rgba(236, 72, 153, 0.4)",
    cardBg: "rgba(236, 72, 153, 0.03)",
    cardBorder: "rgba(236, 72, 153, 0.25)",
    glassPanelBg: "rgba(18, 5, 32, 0.6)",
    textPrimary: "#FDF2F8",
    textMuted: "rgba(253, 242, 248, 0.5)",
  },
];

export interface CustomThemeSettings {
  activeThemeId: string;
  isCustom: boolean;
  customAccent?: string;
  customBgGradientStart?: string;
  customBgGradientEnd?: string;
  glowIntensity?: "low" | "medium" | "high";
  glassBlur?: "low" | "medium" | "high";
}

interface ThemeContextType {
  currentTheme: NitroTheme;
  themeSettings: CustomThemeSettings;
  setTheme: (themeId: string) => void;
  setCustomTheme: (settings: Partial<CustomThemeSettings>) => void;
  resetToDefault: () => void;
  saveToServer: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "next_notes_nitro_theme_config";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeSettings, setThemeSettings] = useState<CustomThemeSettings>({
    activeThemeId: "default-blurple",
    isCustom: false,
    glowIntensity: "medium",
    glassBlur: "medium",
  });

  const [mounted, setMounted] = useState(false);

  // Load initial theme from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeSettings(parsed);
      }
    } catch {
      // Ignore fallback
    }
    setMounted(true);
  }, []);

  const activeTheme =
    NITRO_THEMES.find((t) => t.id === themeSettings.activeThemeId) || NITRO_THEMES[0];

  // Apply theme variables to document root
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    const accent = themeSettings.isCustom && themeSettings.customAccent
      ? themeSettings.customAccent
      : activeTheme.accent;

    const bgRadial =
      themeSettings.isCustom && themeSettings.customBgGradientStart && themeSettings.customBgGradientEnd
        ? `radial-gradient(at 0% 0%, ${themeSettings.customBgGradientStart}44 0px, transparent 50%), radial-gradient(at 100% 100%, ${themeSettings.customBgGradientEnd}44 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(10, 5, 20, 0.6) 0px, transparent 70%)`
        : activeTheme.bgRadial;

    const blurMap = {
      low: "8px",
      medium: "16px",
      high: "24px",
    };
    const blurValue = blurMap[themeSettings.glassBlur || "medium"];

    root.style.setProperty("--theme-accent", accent);
    root.style.setProperty("--theme-accent-glow", activeTheme.accentGlow);
    root.style.setProperty("--theme-bg-primary", activeTheme.bgPrimary);
    root.style.setProperty("--theme-bg-secondary", activeTheme.bgSecondary);
    root.style.setProperty("--theme-bg-radial", bgRadial);
    root.style.setProperty("--theme-card-bg", activeTheme.cardBg);
    root.style.setProperty("--theme-card-border", activeTheme.cardBorder);
    root.style.setProperty("--theme-glass-panel-bg", activeTheme.glassPanelBg);
    root.style.setProperty("--theme-text-primary", activeTheme.textPrimary);
    root.style.setProperty("--theme-glass-blur", blurValue);

    // Save to local storage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeSettings));
    } catch {
      // ignore
    }
  }, [themeSettings, activeTheme]);

  const setTheme = (themeId: string) => {
    setThemeSettings((prev) => ({
      ...prev,
      activeThemeId: themeId,
      isCustom: false,
    }));
  };

  const setCustomTheme = (settings: Partial<CustomThemeSettings>) => {
    setThemeSettings((prev) => ({
      ...prev,
      ...settings,
      isCustom: true,
    }));
  };

  const resetToDefault = () => {
    const defaultSettings: CustomThemeSettings = {
      activeThemeId: "default-blurple",
      isCustom: false,
      glowIntensity: "medium",
      glassBlur: "medium",
    };
    setThemeSettings(defaultSettings);
  };

  const saveToServer = async () => {
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig: themeSettings }),
      });
    } catch (err) {
      console.error("Failed to sync theme with server", err);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: activeTheme,
        themeSettings,
        setTheme,
        setCustomTheme,
        resetToDefault,
        saveToServer,
      }}
    >
      <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.2s ease" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useNitroTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useNitroTheme must be used within a ThemeProvider");
  }
  return context;
}
