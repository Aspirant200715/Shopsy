import useAuth from "../context/useAuth";
import { Navigate } from "react-router-dom";
import ShopsyLoader from "./ShopsyLoader";

function ProtectedRoute({ children }) {
  const { customer, loader } = useAuth();

  if (loader) {
    return <ShopsyLoader fullScreen />;
  }

  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
