import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

const HorizontalProductCarousel = ({ products, title = "You May Also Like", onProductClick }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollButtons();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [products]);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector('.product-card-wrapper')?.offsetWidth || 320;
    const gap = 20;
    const scrollAmount = cardWidth + gap;

    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  const scrollToIndex = (index) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector('.product-card-wrapper')?.offsetWidth || 320;
    const gap = 20;
    const scrollAmount = (cardWidth + gap) * index;

    container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector('.product-card-wrapper')?.offsetWidth || 320;
    const gap = 20;
    const scrollAmount = cardWidth + gap;

    const newIndex = Math.round(container.scrollLeft / scrollAmount);
    setActiveIndex(Math.max(0, Math.min(newIndex, products.length - 1)));
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-2">Curated picks based on your interests</p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <motion.button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              whileHover={{ scale: canScrollLeft ? 1.05 : 1 }}
              whileTap={{ scale: canScrollLeft ? 0.95 : 1 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                canScrollLeft
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={24} />
            </motion.button>

            <motion.button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              whileHover={{ scale: canScrollRight ? 1.05 : 1 }}
              whileTap={{ scale: canScrollRight ? 0.95 : 1 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                canScrollRight
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={24} />
            </motion.button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, index) => {
              // SAME MAPPING AS IN AllProduct.jsx
              const firstVariant = product.variants?.[0] || {};
              const priceInfo = (() => {
                let minPrice = Infinity;
                let originalPrice = null;
                let hasStock = false;

                product.variants?.forEach(v => {
                  v.sizes?.forEach(s => {
                    if (s.stock > 0) {
                      hasStock = true;
                      if (s.price < minPrice) {
                        minPrice = s.price;
                        originalPrice = s.originalPrice;
                      }
                    }
                  });
                });

                return {
                  minPrice: minPrice === Infinity ? null : minPrice,
                  originalPrice: originalPrice || minPrice,
                  hasStock,
                };
              })();

              const mappedProduct = {
                _id: product._id,
                name: product.name,
                category: product.category,
                price: priceInfo.minPrice,
                originalPrice: priceInfo.originalPrice,
                images: firstVariant.images || [],
                variants: product.variants, // keep for inStock fallback
                inStock: priceInfo.hasStock,
                isNew: new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                averageRating: product.averageRating || 4.5,
                totalReviews: product.totalReviews || 0,
              };

              return (
                <motion.div
                  key={product._id || index}
                  className="product-card-wrapper flex-shrink-0 w-[280px] sm:w-[320px]"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard
                    product={mappedProduct}
                    onClick={() => onProductClick?.(product)}
                  />
                </motion.div>
              );
            })}
          </div>

          <div className="flex md:hidden items-center justify-center gap-4 mt-6">
            <motion.button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              whileTap={{ scale: 0.9 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                canScrollLeft ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              <ChevronLeft size={20} />
            </motion.button>

            <motion.button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              whileTap={{ scale: 0.9 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                canScrollRight ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {products.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => scrollToIndex(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`transition-all rounded-full ${
                index === activeIndex
                  ? 'w-8 h-2 bg-black'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default HorizontalProductCarousel;