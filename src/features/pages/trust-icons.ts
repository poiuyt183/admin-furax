import {
  Award,
  BadgeCheck,
  Clock,
  Headphones,
  Heart,
  MapPin,
  Package,
  Phone,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { TrustIconKey } from "./trust-items";

export const TRUST_ICON_OPTIONS: Array<{
  value: TrustIconKey;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "truck", label: "Giao hàng", icon: Truck },
  { value: "headphones", label: "Hỗ trợ", icon: Headphones },
  { value: "map-pin", label: "Địa điểm", icon: MapPin },
  { value: "shield", label: "Bảo hành", icon: Shield },
  { value: "star", label: "Đánh giá", icon: Star },
  { value: "badge-check", label: "Cam kết", icon: BadgeCheck },
  { value: "clock", label: "Thời gian", icon: Clock },
  { value: "phone", label: "Hotline", icon: Phone },
  { value: "wrench", label: "Kỹ thuật", icon: Wrench },
  { value: "package", label: "Đóng gói", icon: Package },
  { value: "award", label: "Chất lượng", icon: Award },
  { value: "users", label: "Khách hàng", icon: Users },
  { value: "zap", label: "Nhanh chóng", icon: Zap },
  { value: "heart", label: "Yêu thích", icon: Heart },
  { value: "thumbs-up", label: "Uy tín", icon: ThumbsUp },
  { value: "sparkles", label: "Cao cấp", icon: Sparkles },
];
