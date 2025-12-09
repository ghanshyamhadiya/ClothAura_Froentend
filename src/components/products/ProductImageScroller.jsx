import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn"; // Assuming you have this utility

// Constants for swiping
const SWIPE_CONFIDENCE_THRESHOLD = 10000;
const SWIPE_POWER = 10000;

const getImageUrl = (image) => {
  if (typeof image === 'string') {
    return image;
  }
  return image?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
};

// Animation Variants for Image Slide
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%', // Start off-screen
    opacity: 0,
    scale: 1.05,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%', // Exit off-screen
    opacity: 0,
    scale: 0.95,
  })
};

const ProductImageScroller = ({ images = [] }) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = useCallback((newDirection) => {
    setDirection(newDirection);
    setIndex((prevIndex) => {
      let newIndex = prevIndex + newDirection;
      if (newIndex < 0) {
        return images.length - 1;
      } else if (newIndex >= images.length) {
        return 0;
      }
      return newIndex;
    });
  }, [images.length]);

  const handleThumbnailClick = useCallback((newIndex) => {
    setDirection(newIndex > index ? 1 : -1);
    setIndex(newIndex);
  }, [index]);

  // Framer Motion Drag handler
  const handleDragEnd = (e, { offset, velocity }) => {
    const swipe = offset.x;
    const swipePower = velocity.x;

    // Check for a fast swipe
    if (swipe < -SWIPE_POWER || (swipe < -100 && swipePower > SWIPE_CONFIDENCE_THRESHOLD)) {
      paginate(1); // Swipe left -> Next
    } else if (swipe > SWIPE_POWER || (swipe > 100 && swipePower < -SWIPE_CONFIDENCE_THRESHOLD)) {
      paginate(-1); // Swipe right -> Previous
    }
    // If not a strong swipe, it snaps back automatically
  };


  if (!images.length) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
        No Images Available
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Main Image Viewer with Swiping */}
      <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-xl">
        <AnimatePresence initial={false} custom={direction}>
          {/* Draggable container */}
          <motion.div
            key={index}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }} // Don't allow actual movement, just capture drag
            dragElastic={0.5} // How far you can pull
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab"
            style={{ touchAction: 'pan-y' }} // Improve touch compatibility
          >
            <motion.img
              src={getImageUrl(images[index])}
              alt={`Product ${index + 1}`}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="w-full h-full object-cover object-center pointer-events-none" // pointer-events-none prevents drag interference
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <div className="absolute inset-0 flex justify-between items-center px-4 z-10">
            <motion.button
              onClick={() => paginate(-1)}
              className="p-2 w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} className="text-gray-800" />
            </motion.button>
            <motion.button
              onClick={() => paginate(1)}
              className="p-2 w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Next image"
            >
              <ChevronRight size={20} className="text-gray-800" />
            </motion.button>
          </div>
        )}
      </div>

      {/* 2. Thumbnail Gallery - Placed BELOW the main image container (No Overlap) */}
      {images.length > 1 && (
        <div className="flex justify-center sm:justify-start overflow-x-auto pb-2 gap-3 mt-2">
          {images.map((img, i) => (
            <motion.button
              key={i}
              onClick={() => handleThumbnailClick(i)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all duration-300 border-2",
                index === i
                  ? "border-black shadow-lg scale-105"
                  : "border-gray-200 hover:border-gray-400"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`View image ${i + 1}`}
            >
              <img
                src={getImageUrl(img)}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover object-center"
              />
              {index !== i && (
                <div className="absolute inset-0 bg-black/10 transition-colors hover:bg-transparent" />
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageScroller;