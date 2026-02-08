import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const CouponSuccessAnimation = ({ discountAmount, show, onComplete }) => {
    const [confetti, setConfetti] = useState([]);

    useEffect(() => {
        if (show) {
            // Generate confetti particles
            const newConfetti = Array.from({ length: 30 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 0.3,
                duration: 1 + Math.random() * 0.5,
                rotation: Math.random() * 360,
                color: ['#000', '#333', '#666', '#999'][Math.floor(Math.random() * 4)]
            }));
            setConfetti(newConfetti);

            // Auto dismiss
            const timer = setTimeout(() => {
                onComplete?.();
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black pointer-events-none"
                    />

                    {/* Confetti */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {confetti.map((particle) => (
                            <motion.div
                                key={particle.id}
                                initial={{
                                    x: `${particle.x}vw`,
                                    y: '-10%',
                                    rotate: 0,
                                    opacity: 1
                                }}
                                animate={{
                                    y: '110%',
                                    rotate: particle.rotation,
                                    opacity: 0
                                }}
                                transition={{
                                    duration: particle.duration,
                                    delay: particle.delay,
                                    ease: 'linear'
                                }}
                                className="absolute w-2 h-2 rounded-sm"
                                style={{ backgroundColor: particle.color }}
                            />
                        ))}
                    </div>

                    {/* Success Card */}
                    <motion.div
                        initial={{ scale: 0.3, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -30 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 text-center max-w-sm mx-4"
                    >
                        {/* Sparkle decorations */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            className="absolute -top-4 -right-4"
                        >
                            <Sparkles className="w-8 h-8 text-gray-400" />
                        </motion.div>
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                            className="absolute -bottom-2 -left-2"
                        >
                            <Sparkles className="w-6 h-6 text-gray-300" />
                        </motion.div>

                        {/* Check Circle */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2, damping: 10 }}
                            className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <motion.div
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                            >
                                <Check className="w-10 h-10 text-white" strokeWidth={3} />
                            </motion.div>
                        </motion.div>

                        {/* Text */}
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-gray-900 mb-2"
                        >
                            Coupon Applied!
                        </motion.h2>

                        {/* Discount Amount */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring', damping: 10 }}
                            className="inline-block"
                        >
                            <span className="text-4xl font-bold text-black">
                                -₹{discountAmount?.toFixed(2) || '0.00'}
                            </span>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-gray-500 mt-2"
                        >
                            Discount added to your order
                        </motion.p>

                        {/* Animated ring */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ delay: 0.2, duration: 1, repeat: 2 }}
                            className="absolute inset-0 rounded-3xl border-2 border-black pointer-events-none"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CouponSuccessAnimation;
