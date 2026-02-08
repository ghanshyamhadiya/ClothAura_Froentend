import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        shop: [
            { name: 'All Products', path: '/products' },
            { name: 'Categories', path: '/categories' },
            { name: 'New Arrivals', path: '/products?sort=new' },
            { name: 'Best Sellers', path: '/products?sort=popular' }
        ],
        support: [
            { name: 'Contact Us', path: '/contact' },
            { name: 'FAQs', path: '/faq' },
            { name: 'Shipping Policy', path: '/shipping' },
            { name: 'Returns & Exchanges', path: '/returns' }
        ],
        company: [
            { name: 'About Us', path: '/about' },
            { name: 'Terms of Service', path: '/terms' },
            { name: 'Privacy Policy', path: '/privacy' },
            { name: 'Sustainability', path: '/sustainability' }
        ]
    };

    const socialLinks = [
        { icon: Facebook, href: '#' },
        { icon: Instagram, href: '#' },
        { icon: Twitter, href: '#' },
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <footer className="bg-white text-black pt-20 pb-10 overflow-hidden relative border-t border-gray-100">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                >
                    {/* Brand Column */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tighter text-black uppercase">CLOTHAURA.</h2>
                        <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                            Redefining minimal elegance with premium quality and sustainable practices. Experience the difference.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social, idx) => (
                                <motion.a
                                    key={idx}
                                    href={social.href}
                                    whileHover={{ y: -3, backgroundColor: '#000', color: '#fff' }}
                                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-white transition-all duration-300"
                                >
                                    <social.icon size={18} />
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Links Columns */}
                    <motion.div variants={itemVariants}>
                        <h3 className="text-lg font-semibold mb-6 text-black">Shop</h3>
                        <ul className="space-y-4">
                            {footerLinks.shop.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="text-gray-600 hover:text-black transition-colors text-sm flex items-center gap-2 group"
                                    >
                                        <span className="w-0 group-hover:w-2 h-[1px] bg-black transition-all duration-300"></span>
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h3 className="text-lg font-semibold mb-6 text-black">Support</h3>
                        <ul className="space-y-4">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="text-gray-600 hover:text-black transition-colors text-sm flex items-center gap-2 group"
                                    >
                                        <span className="w-0 group-hover:w-2 h-[1px] bg-black transition-all duration-300"></span>
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Newsletter Column */}
                    <motion.div variants={itemVariants}>
                        <h3 className="text-lg font-semibold mb-6 text-black">Stay in the loop</h3>
                        <p className="text-gray-600 text-sm mb-6">
                            Subscribe to receive updates, access to exclusive deals, and more.
                        </p>
                        <form className="relative" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full bg-gray-100 text-gray-900 px-4 py-3 pr-12 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black transition border-none"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </form>
                        <p className="text-xs text-gray-500 mt-4">
                            By subscribing you agree to our Terms & Conditions.
                        </p>
                    </motion.div>
                </motion.div>

                {/* Bottom Bar */}
                <motion.div
                    className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                >
                    <p className="text-gray-500 text-xs text-center md:text-left">
                        © {currentYear} CLOTHAURA. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-gray-500 justify-center">
                        <Link to="/privacy" className="hover:text-black transition">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-black transition">Terms of Service</Link>
                        <Link to="/cookies" className="hover:text-black transition">Cookie Settings</Link>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;
