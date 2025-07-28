import React from 'react';
import { ShieldQuestion } from 'lucide-react';

const LogoIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) => {
  // Using ShieldQuestion as a base, can be replaced with a custom SVG path
  return <ShieldQuestion className={className} {...props} />;
};

export default LogoIcon;
