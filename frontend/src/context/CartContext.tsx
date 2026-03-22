"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItem = {
    varId: string;
    pid: string;
    name: string;
    emoji: string;
    bg: string;
    label: string;
    price: number;
    weight: number;
    stock: number;
    qty: number;
    img?: string;
};

interface CartContextProps {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    updateQty: (varId: string, delta: number) => void;
    removeItem: (varId: string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextProps>({
    cart: [],
    addToCart: () => { },
    updateQty: () => { },
    removeItem: () => { },
    clearCart: () => { },
    cartCount: 0,
    cartTotal: 0,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load from local storage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("krishimane_cart");
            if (saved) {
                setCart(JSON.parse(saved));
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Save to local storage whenever cart changes
    useEffect(() => {
        localStorage.setItem("krishimane_cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (newItem: CartItem) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.varId === newItem.varId);
            if (existing) {
                if (existing.qty >= existing.stock) return prev;
                return prev.map((item) =>
                    item.varId === newItem.varId ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, newItem];
        });
    };

    const updateQty = (varId: string, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.varId === varId) {
                        const newQty = item.qty + delta;
                        if (newQty <= 0) return null; // Remove it
                        if (newQty > item.stock) return { ...item, qty: item.stock };
                        return { ...item, qty: newQty };
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[];
        });
    };

    const removeItem = (varId: string) => {
        setCart((prev) => prev.filter((item) => item.varId !== varId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartCount = cart.reduce((total, item) => total + item.qty, 0);
    const cartTotal = cart.reduce((total, item) => total + item.price * item.qty, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                updateQty,
                removeItem,
                clearCart,
                cartCount,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
