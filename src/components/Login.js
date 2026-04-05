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
  const { login, loading: authLoading } = useAuth();

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

    try {
      console.log('Intentando iniciar sesión para:', email);
      const { success, error: loginError } = await login(email, password);
      console.log('Resultado login:', { success, loginError });
      
      if (success) {
        console.log('Login exitoso, navegando a /');
        navigate('/');
      } else {
        console.error('Error en login:', loginError);
        setError(loginError || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Excepción en handleLogin:', err);
      setError('Ocurrió un error inesperado al intentar ingresar.');
    } finally {
      setLoading(false);
    }
  };

  const isAnyLoading = loading || authLoading;

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
            disabled={isAnyLoading}
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
            disabled={isAnyLoading}
            autoComplete="current-password"
          />

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
            disabled={isAnyLoading}
          >
            {isAnyLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>

          {isAnyLoading && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Esperando respuesta del servidor...
              </Typography>
              <Button 
                size="small" 
                variant="text" 
                onClick={() => window.location.reload()}
                sx={{ mt: 1, textTransform: 'none', fontSize: '0.75rem' }}
              >
                ¿Tarda demasiado? Recargar página
              </Button>
            </Box>
          )}
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