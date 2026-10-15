import { ChartNoAxesColumn, ChartSpline, Dumbbell, House, Utensils } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/home", label: "ホーム", icon: House },
  { href: "/training", label: "トレ", icon: Dumbbell },
  { href: "/nutrition", label: "食事", icon: Utensils },
  { href: "/condition", label: "コンディション", icon: ChartNoAxesColumn },
  { href: "/analysis", label: "分析", icon: ChartSpline },
] as const;
