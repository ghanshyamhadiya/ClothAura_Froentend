import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import { CartWishlistProvider } from './context/CartWhislistContext.jsx'
import { ReviewProvider } from './context/ReviewContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { ProductProvider } from './context/ProductContext.jsx'
import { CouponProvider } from './context/CouponContext.jsx'
import AuthModelProvider from './context/AuthModelContext.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthModelProvider>
        <SocketProvider>
          <AuthProvider>
            <ProductProvider>
              <CartWishlistProvider>
                <ReviewProvider>
                  <CouponProvider>
                    <App />
                  </CouponProvider>
                </ReviewProvider>
              </CartWishlistProvider>
            </ProductProvider>
          </AuthProvider>
        </SocketProvider>
      </AuthModelProvider>
    </BrowserRouter>
  </StrictMode >,
)
