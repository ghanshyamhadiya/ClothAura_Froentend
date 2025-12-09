import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

const Button = ({
  children,
  icon,
  onClick,
  to,     // React Router navigation
  href,   // External links
  className,
  primary = true,
  size = "md",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantStyles = primary
    ? "bg-black text-white hover:bg-gray-800 focus:ring-black"
    : "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400";

  const combined = cn(baseStyles, sizeStyles[size], variantStyles, className);

  if (to) {
    return (
      <Link to={to} className={combined} {...props}>
        {icon && <span>{icon}</span>}
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combined} target="_blank" rel="noopener noreferrer" {...props}>
        {icon && <span>{icon}</span>}
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={combined} {...props}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
