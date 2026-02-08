// Hook to open auth modal programmatically
export const useAuthModal = () => {
    const openLoginModal = () => {
        window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }));
    };

    const openSignupModal = () => {
        window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'signup' } }));
    };

    return { openLoginModal, openSignupModal };
};
