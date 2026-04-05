import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones básicas
    if (!email || !password) {
      setError('Por favor ingresa email y contraseña');
      setLoading(false);
      return;
    }

    const { success, error: loginError } = await login(email, password);
    
    if (success) {
      navigate('/');
    } else {
      setError(loginError || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Sistema de Gestión Clínica
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.secondary' }}>
          Posgrado Ortodoncia - Universidad del Valle
        </Typography>

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@uv.edu.co"
            disabled={loading}
            autoComplete="email"
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Usuarios de prueba:</strong><br/>
            Director: director@uv.clinica<br/>
            Docente: docente@uv.clinica
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;