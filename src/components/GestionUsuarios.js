import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import ProfessionalTable from './ProfessionalTable';
import ProfessionalForm from './ProfessionalForm';

const GestionUsuarios = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState(null);
  const { isDirector } = useAuth();

  const formFields = [
    { name: 'email', label: 'Correo Electrónico', required: true, fullWidth: true, disabled: !!editingId },
    {
      name: 'rol',
      label: 'Rol',
      type: 'select',
      required: true,
      options: [
        { value: 'docente', label: 'Docente' },
        { value: 'director', label: 'Director' },
      ],
    },
    { name: 'estado', label: 'Usuario Activo', type: 'checkbox' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('user_roles')
        .select('*')
        .eq('rol', 'docente') // Filtrar para mostrar solo docentes
        .order('email');

      if (err) throw err;
      setDocentes(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar la lista de docentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDirector()) {
      fetchData();
    }
  }, []);

  const handleVincularDocente = async () => {
    const email = linkEmail.trim();
    if (!email) {
      setLinkMessage({ severity: 'warning', text: 'Escribe el correo del docente.' });
      return;
    }
    setLinkLoading(true);
    setLinkMessage(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('vincular_docente_por_email', {
        p_email: email,
      });
      if (rpcError) {
        setLinkMessage({
          severity: 'error',
          text: rpcError.message || 'Error al ejecutar la función en el servidor.',
        });
        return;
      }
      let result = data;
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch {
          result = {};
        }
      }
      if (result && typeof result === 'object' && result.ok === false) {
        setLinkMessage({ severity: 'error', text: result.error || 'No se pudo vincular.' });
        return;
      }
      setLinkMessage({ severity: 'success', text: result?.message || 'Docente vinculado.' });
      setLinkEmail('');
      await fetchData();
    } catch (err) {
      setLinkMessage({ severity: 'error', text: err.message || 'Error inesperado.' });
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUpdateUser = async (formData) => {
    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({
          rol: formData.rol,
          estado: formData.estado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (updateError) throw updateError;
      
      fetchData();
      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Error al actualizar docente');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: 'email', header: 'Correo Electrónico' },
    { field: 'rol', header: 'Rol' },
    {
      field: 'estado',
      header: 'Estado',
      type: 'status',
    },
    {
      field: 'updated_at',
      header: 'Última Actualización',
      render: (val) => new Date(val).toLocaleDateString('es-CO'),
    },
  ];

  if (loading && docentes.length === 0) {
    return (
      <>
        <NavBar title="Gestión de Docentes" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Gestión de Docentes" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          Cada docente debe tener cuenta en <strong>Authentication</strong> y una fila en{' '}
          <strong>user_roles</strong> con el mismo id. Si ya creaste el usuario en Auth pero no aparece
          aquí o no puede entrar, usa &quot;Vincular docente&quot; o ejecuta el SQL{' '}
          <code style={{ fontSize: '0.85em' }}>VINCULAR_DOCENTES.sql</code> en Supabase.
        </Alert>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Gestión de docentes
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Roles y estado en <code>user_roles</code> (vinculados a Auth).
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAddAltIcon />}
              onClick={() => {
                setLinkOpen(true);
                setLinkMessage(null);
              }}
            >
              Vincular docente
            </Button>
          </Box>

          <ProfessionalTable
            columns={columns}
            data={docentes}
            onEdit={(row) => {
              setEditingId(row.id);
              setFormOpen(true);
            }}
            title="Docentes"
          />
        </Paper>

        <ProfessionalForm
          open={formOpen}
          title="Editar Usuario"
          fields={formFields}
          initialData={editingId ? docentes.find(d => d.id === editingId) : null}
          onClose={() => {
            setFormOpen(false);
            setEditingId(null);
          }}
          onSubmit={handleUpdateUser}
          loading={loading}
        />

        <Dialog open={linkOpen} onClose={() => !linkLoading && setLinkOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Vincular docente existente</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              El correo debe coincidir exactamente con el de la cuenta en Supabase Authentication.
              Requiere la función RPC <code>vincular_docente_por_email</code> (archivo VINCULAR_DOCENTES.sql).
            </Typography>
            {linkMessage && (
              <Alert severity={linkMessage.severity} sx={{ mb: 2 }} onClose={() => setLinkMessage(null)}>
                {linkMessage.text}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Correo del docente"
              type="email"
              fullWidth
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              disabled={linkLoading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLinkOpen(false)} disabled={linkLoading}>
              Cerrar
            </Button>
            <Button variant="contained" onClick={handleVincularDocente} disabled={linkLoading}>
              {linkLoading ? 'Vinculando…' : 'Vincular'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default GestionUsuarios;
