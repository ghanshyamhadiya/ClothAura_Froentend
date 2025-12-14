import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import ProductReviews from "../review/ProductReviews";

const ProductReviewsLazy = ({ productId }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: "200px",
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (inView) setIsLoaded(true);
  }, [inView]);

  return (
    <div ref={ref} className="min-h-64">
      {isLoaded ? (
        <ProductReviews productId={productId} />
      ) : (
        <motion.div
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="py-20 text-center"
        >
          <p className="text-gray-500 font-medium">Loading customer reviews...</p>
        </motion.div>
      )}
    </div>
  );
};

export default ProductReviewsLazy;