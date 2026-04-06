import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, Avatar, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';

/**
 * NavBar componente - Barra de navegación profesional
 * Se muestra en todas las páginas
 */
const NavBar = ({ title = 'Sistema de Gestión Clínica' }) => {
  const { user, logout, isDirector } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const handleDashboard = () => {
    handleMenuClose();
    navigate('/dashboard');
  };

  const getUserInitials = () => {
    if (!user?.email) return '?';
    return user.email.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = () => {
    return isDirector() ? '👨‍✍️ Director' : '👨‍🏫 Docente';
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo y Título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={handleDashboard}>
          <DashboardIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', margin: 0 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Universidad del Valle - Ortodoncia
            </Typography>
          </Box>
        </Box>

        {/* Usuario y menú */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <strong>{user?.email}</strong>
            <br />
            <span style={{ opacity: 0.9, fontSize: '12px' }}>{getRoleLabel()}</span>
          </Typography>

          <Button
            onClick={handleMenuOpen}
            sx={{
              borderRadius: '50%',
              padding: 1,
              minWidth: '44px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                backgroundColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              {getUserInitials()}
            </Avatar>
          </Button>

          {/* Menú desplegable */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: { 
                minWidth: 250,
                borderRadius: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }
            }}
          >
            <MenuItem disabled sx={{ color: 'text.secondary' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem disabled sx={{ color: 'text.secondary', fontSize: '12px' }}>
              {getRoleLabel()}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDashboard} sx={{ color: 'primary.main' }}>
              <DashboardIcon sx={{ mr: 1 }} />
              Panel Principal
            </MenuItem>
            {isDirector() && (
              <MenuItem onClick={() => { handleMenuClose(); navigate('/configuracion'); }} sx={{ color: 'primary.main' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                Configuración
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;