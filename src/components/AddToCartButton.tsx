"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/types";

export function AddToCartButton({
  product,
  variant = "primary",
  goToCart = false,
  className = "",
  children,
}: {
  product: Product;
  variant?: "primary" | "accent" | "outline";
  goToCart?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  return (
    <Button
      variant={variant}
      className={className}
      data-testid={`add-to-cart-${product.slug}`}
      onClick={() => {
        add(product);
        if (goToCart) {
          router.push("/store/cart");
          return;
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }}
    >
      {added ? "Added to cart ✓" : (children ?? "Add to cart")}
    </Button>
  );
}
