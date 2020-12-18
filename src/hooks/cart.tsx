import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const sessionProducts = await AsyncStorage.getItem('@GoMarketplace');

      if (sessionProducts) {
        setProducts(JSON.parse(sessionProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(item => item.id === product.id);

      const newProduct = {
        ...product,
        quantity: 1,
      };

      const newProducts = [...products];

      if (productIndex >= 0) {
        newProducts[productIndex].quantity += 1;
      }

      setProducts(productIndex >= 0 ? newProducts : [...products, newProduct]);

      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(newProducts));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.map(product => {
        if (product.id === id) {
          const newProduct = { ...product, quantity: product.quantity - 1 };

          if (newProduct.quantity >= 1) {
            return newProduct;
          }
        }

        return product;
      });

      setProducts(newProducts);
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(newProducts));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
