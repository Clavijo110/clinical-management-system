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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import ProfessionalTable from './ProfessionalTable';
import ProfessionalForm from './ProfessionalForm';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';

const RegistroAtenciones = () => {
  const [atenciones, setAtenciones] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const { user, isDirector } = useAuth();

  const formFields = [
    {
      name: 'estudiante_id',
      label: 'Estudiante',
      type: 'select',
      required: true,
      options: estudiantes.map(e => ({ value: e.id, label: e.nombre })),
    },
    {
      name: 'paciente_id',
      label: 'Paciente',
      type: 'select',
      required: true,
      options: pacientes.map(p => ({ value: p.id, label: p.nombre })),
    },
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'diagnostico', label: 'Diagnóstico', required: true, fullWidth: true },
    { name: 'tratamiento', label: 'Tratamiento Realizado', multiline: true, rows: 4, fullWidth: true },
    { name: 'observaciones', label: 'Observaciones', multiline: true, rows: 2, fullWidth: true },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'completada', label: 'Completada' },
        { value: 'pendiente', label: 'Pendiente' },
      ],
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener estudiantes
      let estudiantesQuery = supabase.from('estudiantes').select('*');
      if (!isDirector()) {
        estudiantesQuery = estudiantesQuery.eq('docente_id', user.id);
      }
      const { data: estData } = await estudiantesQuery;
      setEstudiantes(estData || []);

      if (estData && estData.length > 0) {
        const estIds = estData.map((e) => e.id);

        // Obtener pacientes de esos estudiantes
        const { data: pacData } = await supabase
          .from('pacientes')
          .select('*')
          .in('estudiante_id', estIds);
        setPacientes(pacData || []);

        // Obtener atenciones
        const { data: atData } = await supabase
          .from('atenciones')
          .select('*')
          .in('estudiante_id', estIds);
        setAtenciones(atData || []);
      }
    } catch (error) {
      setError(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    () => {
      fetchData();
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
      if (!formDataToSave.estudiante_id || !formDataToSave.paciente_id || !formDataToSave.fecha) {
        setError('Por favor completa los campos obligatorios');
        return;
      }

      if (editId) {
        const { error: err } = await supabase
          .from('atenciones')
          .update(formDataToSave)
          .eq('id', editId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('atenciones')
          .insert([formDataToSave]);
        if (err) throw err;
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      setError(`Error al guardar: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta atención?')) return;
    try {
      const { error: err } = await supabase
        .from('atenciones')
        .delete()
        .eq('id', id);
      if (err) throw err;
      fetchData();
    } catch (error) {
      setError(`Error al eliminar: ${error.message}`);
    }
  };

  const columns = [
    { field: 'fecha', header: 'Fecha' },
    { field: 'diagnostico', header: 'Diagnóstico' },
    { field: 'tratamiento', header: 'Tratamiento' },
    {
      field: 'estado',
      header: 'Estado',
      type: 'status',
      options: { completada: 'success', pendiente: 'warning' },
    },
  ];

  if (loading) {
    return (
      <>
        <NavBar title="Registro de Atenciones" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Registro de Atenciones" />
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
            Nueva Atención
          </Button>
        </Box>

        <ProfessionalTable
          columns={columns}
          data={atenciones.map((a) => ({
            ...a,
            tratamiento: a.tratamiento?.substring(0, 50) + (a.tratamiento?.length > 50 ? '...' : ''),
          }))}
          onEdit={handleOpenDialog}
          onDelete={(row) => handleDelete(row.id)}
          title="Atenciones"
        />

        <ProfessionalForm
          open={openDialog}
          title={editId ? 'Editar Atención' : 'Nueva Atención'}
          fields={formFields}
          initialData={editId ? atenciones.find(a => a.id === editId) : null}
          onClose={handleCloseDialog}
          onSubmit={handleSave}
          loading={loading}
          error={error}
        />
      </Container>
    </>
  );
};

export default RegistroAtenciones;