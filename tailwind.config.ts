import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#F8F8FF"
        },
        accent: {
          DEFAULT: "#14B8A6",
          foreground: "#F8F8FF"
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#04120d"
        },
        surface: "#13131A",
        surface2: "#1C1C28",
        muted: "#6B7280",
        chart: {
          1: "#7C3AED",
          2: "#06B6D4",
          3: "#10B981",
          4: "#F59E0B",
          5: "#F43F5E"
        }
      },
      borderRadius: {
        lg: "1.25rem",
        md: "1rem",
        sm: "0.75rem"
      },
      boxShadow: {
        glow: "0 18px 50px rgba(37,99,235,0.18)",
        cyan: "0 18px 44px rgba(20,184,166,0.14)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(37,99,235,0.2), transparent 32%), radial-gradient(circle at 80% 20%, rgba(20,184,166,0.16), transparent 26%), linear-gradient(135deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "surface-glass":
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))"
      },
      backgroundSize: {
        grid: "24px 24px"
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        marquee: "marquee 18s linear infinite",
        shine: "shine 2s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 1px rgba(37,99,235,0.2), 0 0 22px rgba(37,99,235,0.12)" },
          "50%": { boxShadow: "0 0 0 1px rgba(20,184,166,0.24), 0 0 32px rgba(20,184,166,0.14)" }
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" }
        },
        shine: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
