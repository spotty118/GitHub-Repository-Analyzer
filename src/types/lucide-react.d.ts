declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  // Define a general icon component type
  export type LucideIcon = ComponentType<LucideProps>;

  // Export all the Lucide icons used in the app
  export const Github: LucideIcon;
  export const FolderTree: LucideIcon;
  export const Copy: LucideIcon;
  export const Download: LucideIcon;
  export const Key: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Info: LucideIcon;
  export const Code2: LucideIcon;
  export const Link2: LucideIcon;
  export const Star: LucideIcon;
  export const GitBranch: LucideIcon;
  export const FileCode: LucideIcon;
  export const LoaderCircle: LucideIcon;
  export const Moon: LucideIcon;
  export const Sun: LucideIcon;
  export const History: LucideIcon;
  export const Share2: LucideIcon;
  
  // Add a general export for all other icons
  export const Icons: Record<string, LucideIcon>;
}