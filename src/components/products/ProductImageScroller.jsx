import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SWIPE_THRESHOLD = 80;

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

const getImageUrl = (image) => {
  if (typeof image === "string") return image;
  return image?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop";
};

const ProductImageScroller = ({ images = [] }) => {
  const [[page, direction], setPage] = useState([0, 0]);

  const imageIndex = ((page % images.length) + images.length) % images.length;

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  const handleDragEnd = (event, { offset }) => {
    if (offset.x < -SWIPE_THRESHOLD) paginate(1);
    if (offset.x > SWIPE_THRESHOLD) paginate(-1);
  };

  const handleThumbnailClick = (index) => {
    const newDirection = index > imageIndex ? 1 : -1;
    setPage([index, newDirection]);
  };

  if (!images.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-medium text-sm">
        No Images Available
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 select-none">
      {/* Main Image - Swipeable */}
      <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden shadow-lg">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={page}
            src={getImageUrl(images[imageIndex])}
            alt={`Product image ${imageIndex + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        </AnimatePresence>

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === imageIndex ? "w-8 bg-white shadow" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => handleThumbnailClick(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-3 transition-all ${
                idx === imageIndex
                  ? "border-black shadow-md scale-105"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img
                src={getImageUrl(img)}
                alt={`Thumbnail ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageScroller;