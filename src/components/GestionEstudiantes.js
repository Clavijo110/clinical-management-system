import React, { useEffect, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Grid,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import ProfessionalTable from './ProfessionalTable';
import ProfessionalForm from './ProfessionalForm';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

const GestionEstudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const { user, isDirector } = useAuth();

  const formFields = [
    { name: 'nombre', label: 'Nombre Completo', required: true, fullWidth: true },
    {
      name: 'semestre_actual',
      label: 'Semestre Actual',
      type: 'select',
      required: true,
      options: [
        { value: 1, label: 'Semestre 1' },
        { value: 2, label: 'Semestre 2' },
        { value: 3, label: 'Semestre 3' },
        { value: 4, label: 'Semestre 4' },
        { value: 5, label: 'Semestre 5' },
        { value: 6, label: 'Semestre 6' },
      ],
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'retirado', label: 'Retirado' },
      ],
    },
  ];

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      let query = supabase.from('estudiantes').select('*');

      if (!isDirector()) {
        query = query.eq('docente_id', user.id);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setEstudiantes(data || []);
    } catch (error) {
      setError(`Error al cargar estudiantes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    () => {
      fetchEstudiantes();
    },
    [user]
  );

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditId(item.id);
    } else {
      setEditId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleSave = async (formDataToSave) => {
    try {
      setLoading(true);
      if (!formDataToSave.nombre) {
        setError('El nombre es requerido');
        setLoading(false);
        return;
      }

      const dataToSave = {
        nombre: formDataToSave.nombre,
        semestre_actual: formDataToSave.semestre_actual,
        estado: formDataToSave.estado,
      };

      if (editId) {
        // Si el estado cambia a 'retirado', desasignar pacientes (RF-08)
        if (formDataToSave.estado === 'retirado') {
          const { error: unassignError } = await supabase
            .from('pacientes')
            .update({ estudiante_id: null })
            .eq('estudiante_id', editId);
          
          if (unassignError) throw unassignError;
          console.log('Pacientes desasignados por retiro de estudiante');
        }

        const { error: err } = await supabase
          .from('estudiantes')
          .update(dataToSave)
          .eq('id', editId);
        if (err) throw err;
      } else {
        dataToSave.docente_id = user.id;
        const { error: err } = await supabase
          .from('estudiantes')
          .insert([dataToSave]);
        if (err) throw err;
      }

      fetchEstudiantes();
      handleCloseDialog();
    } catch (error) {
      setError(`Error al guardar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este estudiante? Sus pacientes quedarán sin asignar.')) return;
    try {
      // Desasignar pacientes
      await supabase
        .from('pacientes')
        .update({ estudiante_id: null })
        .eq('estudiante_id', id);

      const { error: err } = await supabase
        .from('estudiantes')
        .delete()
        .eq('id', id);
      if (err) throw err;
      fetchEstudiantes();
    } catch (error) {
      setError(`Error al eliminar: ${error.message}`);
    }
  };

  const columns = [
    { field: 'nombre', header: 'Nombre' },
    {
      field: 'semestre_actual',
      header: 'Semestre',
      render: (value) => `S${value}`,
    },
    {
      field: 'estado',
      header: 'Estado',
      type: 'status',
      options: { activo: 'success', retirado: 'error' },
    },
  ];

  if (loading) {
    return (
      <>
        <NavBar title="Gestión de Estudiantes" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Gestión de Estudiantes" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Nuevo Estudiante
          </Button>
        </Box>

        <ProfessionalTable
          columns={columns}
          data={estudiantes}
          onEdit={handleOpenDialog}
          onDelete={(row) => handleDelete(row.id)}
          title="Estudiantes"
        />

        <ProfessionalForm
          open={openDialog}
          title={editId ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}
          fields={formFields}
          initialData={editId ? estudiantes.find(e => e.id === editId) : null}
          onClose={handleCloseDialog}
          onSubmit={handleSave}
          loading={loading}
          error={error}
        />
      </Container>
    </>
  );
};

export default GestionEstudiantes;