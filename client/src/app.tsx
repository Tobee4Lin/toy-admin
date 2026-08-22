import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProductsPage from './pages/Products/ProductsPage';
import ProductFormPage from './pages/Products/ProductFormPage';
import CategoriesPage from './pages/Categories/CategoriesPage';
import BlogPage from './pages/Blog/BlogPage';
import BlogFormPage from './pages/Blog/BlogFormPage';
import InquiriesPage from './pages/Inquiries/InquiriesPage';
import CustomersPage from './pages/Customers/CustomersPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import DocumentEditor from './pages/Documents/DocumentEditor';
import SettingsPage from './pages/Settings/SettingsPage';
import LoginPage from './pages/Login/LoginPage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/new" element={<BlogFormPage />} />
        <Route path="blog/:id/edit" element={<BlogFormPage />} />
        <Route path="inquiries" element={<InquiriesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/new" element={<DocumentEditor />} />
        <Route path="documents/:id" element={<DocumentEditor />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
