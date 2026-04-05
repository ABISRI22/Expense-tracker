import React, { useEffect, useRef, useState } from 'react';
import { navbarStyles } from '../assets/dummyStyles';
import img1 from '../assets/logo.png';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ user: propUser, onLogout }) => {
  const navigate = useNavigate();
  const menuRef = useRef();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(propUser || null); 

  const BASE_URL = 'http://localhost:4000/api';

  //  Fetch user from backend if not provided
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(`${BASE_URL}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data.user || response.data;
        setUser(userData);
      } catch (error) {
        console.error("Failed to load profile", error);

        // Optional: handle invalid token
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };


    if (!propUser) {
      fetchUserData();
    } else {
      setUser(propUser);
    }
  }, [propUser, navigate]);

  //closes the toggle menu if click outside the box
   useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

  //  Logout handler
  const handleLogout = () => {
    setMenuOpen(false);
    localStorage.removeItem("token");
    onLogout?.();
    navigate("/login");
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>

        {/*  Logo */}
        <div
          onClick={() => navigate("/")}
          className={navbarStyles.logoContainer}
        >
          <div className={navbarStyles.logoImage}>
            <img src={img1} alt="logo" />
          </div>
          <span className={navbarStyles.logoText}>Fin TrackPro</span>
        </div>

        {/*  User Section */}
        {user && (
          <div className={navbarStyles.userContainer} ref={menuRef}>
            
            <button onClick={toggleMenu} className={navbarStyles.userButton}>
              
              {/* Avatar */}
              <div className={navbarStyles.userAvatar}>
                {user?.name?.[0]?.toUpperCase() || "U"}
                <div className={navbarStyles.statusIndicator}></div>
              </div>

              {/* Name + Email */}
              <div className={navbarStyles.userTextContainer}>
                <p className={navbarStyles.userName}>
                  {user?.name || "User"}
                </p>
                <p className={navbarStyles.userEmail}>
                  {user?.email || "user@expensetracker.com"}
                </p>
              </div>

              <ChevronDown className={navbarStyles.chevronIcon(menuOpen)} />
            </button>

            {/*  Dropdown */}
            {menuOpen && (
              <div className={navbarStyles.dropdownMenu}>

                {/* Header */}
                <div className={navbarStyles.dropdownHeader}>
                  <div className="flex items-center gap-3">

                    <div className={navbarStyles.dropdownAvatar}>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <div className={navbarStyles.dropdownName}>
                        {user?.name || "User"}
                      </div>
                      <div className={navbarStyles.dropdownEmail}>
                        {user?.email || "user@expensetracker.com"}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Profile */}
                <div className={navbarStyles.menuItemContainer}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                    className={navbarStyles.menuItem}
                  >
                    <span className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                </div>

                {/* Logout */}
                <div className={navbarStyles.menuItemContainer}>
                  <button
                    onClick={handleLogout}
                    className={navbarStyles.logoutButton}
                  >
                    <span className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;