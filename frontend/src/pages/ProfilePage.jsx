import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import CartNavLink from "../components/CartNavLink";
import StoreFooter from "../components/StoreFooter";
import useAuth from "../context/useAuth";
import { changePassword } from "../services/customerApi";

function ProfilePage() {
  const { customer } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError("");

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Your new password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(passwordForm);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully.");
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Unable to change your password. Please try again.";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="home-shell profile-shell">
      <header className="topbar">
        <Link to="/" className="brand brand-dark">
          <span className="brand-mark">S</span>
          Shopsy
        </Link>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/wishlist">Wishlist</Link>
          <CartNavLink />
          <Link to="/orders">Orders</Link>
          {customer?.role === "admin" && <Link to="/admin">Admin</Link>}
          <Link to="/logout">Logout</Link>
        </nav>
        <div className="nav-actions">
          <Link className="profile-nav-link active-nav" to="/profile" title="Open your profile">
            {customer?.fullname || "Profile"}
          </Link>
        </div>
      </header>

      <main className="profile-page">
        <section className="profile-heading">
          <div>
            <p className="eyebrow">Your account</p>
            <h1>Profile.</h1>
            <p>Manage your account details and keep your Shopsy login secure.</p>
          </div>
          <div className="profile-avatar" aria-hidden="true">
            {customer?.fullname?.slice(0, 1).toUpperCase()}
          </div>
        </section>

        <div className="profile-layout">
          <section className="profile-card profile-details-card">
            <p className="password-card-eyebrow">Personal details</p>
            <h2>{customer?.fullname}</h2>
            <p>{customer?.email}</p>
            <p>{customer?.phone}</p>
          </section>

          <form className="password-card profile-password-card" onSubmit={handlePasswordChange}>
            <div>
              <p className="password-card-eyebrow">Account security</p>
              <h2>Change password</h2>
            </div>
            <label>
              <span>Current password</span>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    oldPassword: event.target.value,
                  }))
                }
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              <span>New password</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
                autoComplete="new-password"
                minLength="6"
                required
              />
            </label>
            <label>
              <span>Confirm new password</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                autoComplete="new-password"
                minLength="6"
                required
              />
            </label>
            {passwordError && <p className="password-card-error">{passwordError}</p>}
            <button className="primary-btn small-btn" disabled={passwordLoading} type="submit">
              {passwordLoading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}

export default ProfilePage;
