"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, Trash2 } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { products } from "@/lib/data";
import { addToCart, getCart, removeFromCart, getCartTotal, CartItem } from "@/lib/cart";

export default function ShopPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCart(getCart());
    const onUpdate = () => setCart(getCart());
    window.addEventListener("cart-updated", onUpdate);
    return () => window.removeEventListener("cart-updated", onUpdate);
  }, []);

  const handleAdd = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const size = selectedSizes[productId] || product.sizes[0];
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      size,
      quantity: 1,
    });
    setCart(getCart());
    setAddedFeedback(productId);
    setTimeout(() => setAddedFeedback(null), 1500);
  };

  const handleRemove = (productId: string, size: string) => {
    removeFromCart(productId, size);
    setCart(getCart());
  };

  const productGradients: Record<string, string> = {
    "black-tee": "from-zinc-900 to-zinc-800",
    "white-tee": "from-zinc-300 to-zinc-200",
    hoodie: "from-zinc-800 to-zinc-700",
    poster: "from-amber-950/30 to-zinc-900",
    cap: "from-zinc-700 to-zinc-600",
    jacket: "from-zinc-950 to-zinc-800",
  };

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="flex items-end justify-between mb-16">
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-muted border border-border/50 px-3 py-1 mb-6 inline-block">
                Official Merch
              </span>
              <h1 className="font-serif text-5xl md:text-6xl font-light tracking-tight mb-4">
                Shop
              </h1>
              <p className="text-silver max-w-xl leading-relaxed">
                Official HighLife Live merchandise. Premium materials,
                limited runs, culture-forward design.
              </p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-3 border border-border hover:border-silver transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground text-background text-[10px] font-medium flex items-center justify-center rounded-full">
                  {cart.reduce((s, c) => s + c.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </ScrollReveal>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <ScrollReveal key={product.id} delay={i * 0.08}>
              <div className="group border border-border/30 bg-card hover:border-border transition-all duration-500">
                {/* Product Image Placeholder */}
                <div className={`aspect-square bg-gradient-to-br ${productGradients[product.image] || "from-zinc-800 to-zinc-700"} flex items-center justify-center relative overflow-hidden`}>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-3 border border-white/10 flex items-center justify-center">
                      <span className="font-serif text-3xl text-white/30">H</span>
                    </div>
                    <span className="text-[9px] tracking-[0.3em] uppercase text-white/40">
                      HighLife Live
                    </span>
                  </div>
                  {product.image === "white-tee" && (
                    <div className="absolute inset-0 bg-white/5" />
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-sm font-medium tracking-wide mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-serif font-light">
                      ${product.price}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-muted">
                      {product.category}
                    </span>
                  </div>

                  {/* Size Selector */}
                  <div className="mb-4">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-muted block mb-2">
                      Size
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() =>
                            setSelectedSizes((prev) => ({
                              ...prev,
                              [product.id]: size,
                            }))
                          }
                          className={`text-[10px] tracking-wide px-3 py-1.5 border transition-all duration-200 ${
                            (selectedSizes[product.id] || product.sizes[0]) ===
                            size
                              ? "bg-foreground text-background border-foreground"
                              : "bg-transparent text-silver border-border hover:border-silver"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={() => handleAdd(product.id)}
                    className={`w-full py-2.5 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300 ${
                      addedFeedback === product.id
                        ? "bg-green-900/50 text-green-300 border border-green-800/50"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    {addedFeedback === product.id ? "Added" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-background border-l border-border z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/30">
                <h2 className="font-serif text-xl font-light">Your Cart</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 text-silver hover:text-foreground transition-colors"
                  aria-label="Close cart"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted text-center py-12">
                    Your cart is empty.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={`${item.productId}-${item.size}`}
                        className="flex items-start justify-between p-4 bg-card border border-border/20"
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-medium mb-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-muted mb-2">
                            Size: {item.size} | Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-serif">
                            ${item.price * item.quantity}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(item.productId, item.size)}
                          className="p-1 text-muted hover:text-red-400 transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-border/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-silver">Total</span>
                    <span className="font-serif text-xl">
                      ${getCartTotal()}
                    </span>
                  </div>
                  <button
                    className="w-full py-3 bg-foreground/30 text-foreground/50 text-xs tracking-[0.15em] uppercase font-medium cursor-not-allowed"
                    disabled
                  >
                    Checkout (Demo Only)
                  </button>
                  <p className="text-[10px] text-muted text-center mt-2">
                    This is a demo store. No real transactions.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
