import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  LinearProgress,
  Alert,
} from '@mui/material';
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

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                👨‍🏫 Gestión de Docentes
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Administra los roles y estados de los usuarios del sistema.
              </Typography>
            </Box>
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
      </Container>
    </>
  );
};

export default GestionUsuarios;
