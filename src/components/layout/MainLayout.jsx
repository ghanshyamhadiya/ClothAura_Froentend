import React from 'react';
import Header from './Header';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';

function MainLayout() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <Outlet />
      </main>
    </>
  )
}

export default MainLayout
