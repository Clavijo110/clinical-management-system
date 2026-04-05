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
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

const GestionEstudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const { user, isDirector } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    semestre_actual: 1,
    estado: 'activo',
  });

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      let query = supabase.from('estudiantes').select('*');

      if (!isDirector) {
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
      setFormData(item);
    } else {
      setEditId(null);
      setFormData({
        nombre: '',
        semestre_actual: 1,
        estado: 'activo',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semestre_actual' ? parseInt(value) : value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.nombre) {
        setError('El nombre es requerido');
        return;
      }

      const dataToSave = {
        nombre: formData.nombre,
        semestre_actual: formData.semestre_actual,
        estado: formData.estado,
      };

      if (editId) {
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
          onDelete={handleDelete}
        />

        {/* Dialog para crear/editar */}
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>
            {editId ? '✏️ Editar Estudiante' : '➕ Nuevo Estudiante'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  label="Nombre Completo *"
                  variant="outlined"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="semestre_actual"
                  value={formData.semestre_actual}
                  onChange={handleInputChange}
                  label="Semestre"
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  label="Estado"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="activo">✓ Activo</option>
                  <option value="retirado">✗ Retirado</option>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              startIcon={<SaveIcon />}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default GestionEstudiantes;