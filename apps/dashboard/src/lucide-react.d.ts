declare module "lucide-react" {
  import { FC, SVGProps } from "react";
  export type LucideProps = SVGProps<SVGSVGElement> & { size?: number | string; color?: string; strokeWidth?: number | string };
  export type LucideIcon = FC<LucideProps>;
  export const LayoutDashboard: LucideIcon;
  export const FileText: LucideIcon;
  export const Users: LucideIcon;
  export const ArrowLeftRight: LucideIcon;
  export const LogOut: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Clock: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Award: LucideIcon;
  export const DollarSign: LucideIcon;
  export const XCircle: LucideIcon;
  export const Banknote: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const UserCog: LucideIcon;
}
