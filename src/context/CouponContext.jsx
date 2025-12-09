import { createContext, useContext, useState, useEffect } from "react";
import { couponService } from "../services/couponService";
import { toastService } from "../services/toastService";
import { useCallback } from "react";
import { useAuth } from "./AuthContext";


const CouponContext = createContext(null);

export const useCoupon = () => {
    const context = useContext(CouponContext);
    if (!context) {
        throw new Error("useCoupon must be used within a CouponProvider");
    }
    return context;
};

export const CouponProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [userCoupons, setUserCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    useEffect(() => {
        if (isAuthenticated) {
            return;
        } else {
            setCoupons([]);
            setUserCoupons([]);
        }
    }, [isAuthenticated]);

    //fetch all coupons (admin/owner)
    const fetchCoupons = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await couponService.getAllCoupons(params);
            setCoupons(response.coupons || []);
        } catch (err) {
            setError(err.message || "Failed to fetch coupons");
            toastService.error(err.message || "Failed to fetch coupons");
        } finally {
            setLoading(false);
        }
    }, [])

    // Fetch user coupons
    const fetchUserCoupons = useCallback(async () => {
        try {
            const response = await couponService.getUserCoupons();
            if (response.success) {
                setUserCoupons(response.coupons || []);
            }
        } catch (err) {
            console.error('Failed to fetch user coupons:', err);
        }
    }, []);

    // Create coupon
    const createCoupon = useCallback(async (couponData) => {
        setLoading(true);
        try {
            const response = await couponService.createCoupon(couponData);
            if (response.success) {
                await fetchCoupons();
                toastService.success('Coupon created successfully');
                return response;
            }
        } catch (err) {
            toastService.error(err.response?.data?.message || 'Failed to create coupon');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCoupons]);

    // Update coupon
    const updateCoupon = useCallback(async (id, couponData) => {
        setLoading(true);
        try {
            const response = await couponService.updateCoupon(id, couponData);
            if (response.success) {
                await fetchCoupons();
                toastService.success('Coupon updated successfully');
                return response;
            }
        } catch (err) {
            toastService.error(err.response?.data?.message || 'Failed to update coupon');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCoupons]);

    // Delete coupon
    const deleteCoupon = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await couponService.deleteCoupon(id);
            if (response.success) {
                await fetchCoupons();
                toastService.success('Coupon deleted successfully');
                return response;
            }
        } catch (err) {
            toastService.error(err.response?.data?.message || 'Failed to delete coupon');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCoupons]);

    // Validate coupon
    const validateCoupon = useCallback(async (code, amount) => {
        try {
            const response = await couponService.validateCoupon(code, amount);
            return response;
        } catch (err) {
            toastService.error(err.response?.data?.message || 'Failed to validate coupon');
            throw err;
        }
    }, []);

    const value = {
        coupons,
        userCoupons,
        loading,
        error,
        fetchCoupons,
        fetchUserCoupons,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        validateCoupon
    };

    return (
        <CouponContext.Provider value={value}>
            {children}
        </CouponContext.Provider>
    );
};
