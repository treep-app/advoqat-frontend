import * as React from "react";

export function Avatar({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        `relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 items-center justify-center ${className}`
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt = "", className = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className={`object-cover w-full h-full ${className}`}
      {...props}
    />
  ) : null;
}

export function AvatarFallback({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-center w-full h-full text-gray-500 bg-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
} 