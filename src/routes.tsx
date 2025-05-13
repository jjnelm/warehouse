import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/products/Products';
import ProductDetail from './pages/products/ProductDetail';
import AddProduct from './pages/products/AddProduct';
import EditProduct from './pages/products/EditProduct';
import Inventory from './pages/inventory/Inventory';
import InventoryDetail from './pages/inventory/InventoryDetail';
import Locations from './pages/locations/Locations';
import AddLocation from './pages/locations/AddLocation';
import Orders from './pages/orders/Orders';
import OrderDetail from './pages/orders/OrderDetail';
import CreateOrder from './pages/orders/CreateOrder';
import Suppliers from './pages/suppliers/Suppliers';
import AddSupplier from './pages/suppliers/AddSupplier';
import Customers from './pages/customers/Customers';
import AddCustomer from './pages/customers/AddCustomer';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AddInventory from './pages/inventory/AddInventory';
import Shipments from './pages/shipments/Shipments';
import ShipmentDetail from './pages/shipments/ShipmentDetail';
import NewShipment from './pages/shipments/NewShipment';

const AppRoutes = () => {
  const { user } = useAuthStore();

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/add" element={<AddProduct />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/edit/:id" element={<EditProduct />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/add" element={<AddInventory />} />
          <Route path="/inventory/:id" element={<InventoryDetail />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/add" element={<AddLocation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/create" element={<CreateOrder />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/add" element={<AddSupplier />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/add" element={<AddCustomer />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/shipments/new" element={<NewShipment />} />
          <Route path="/shipments/:id" element={<ShipmentDetail />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRoutes;