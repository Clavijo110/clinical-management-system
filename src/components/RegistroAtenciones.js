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
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    estudiante_id: '',
    paciente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
    estado: 'completada',
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener estudiantes del docente
      const { data: estData } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('docente_id', user.id);
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
      setFormData(item);
    } else {
      setEditId(null);
      setFormData({
        estudiante_id: '',
        paciente_id: '',
        fecha: new Date().toISOString().split('T')[0],
        diagnostico: '',
        tratamiento: '',
        observaciones: '',
        estado: 'completada',
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (!formData.estudiante_id || !formData.paciente_id || !formData.fecha) {
        setError('Por favor completa los campos obligatorios');
        return;
      }

      if (editId) {
        const { error: err } = await supabase
          .from('atenciones')
          .update(formData)
          .eq('id', editId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('atenciones')
          .insert([formData]);
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
          onDelete={handleDelete}
        />

        {/* Dialog para crear/editar */}
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>
            {editId ? '✏️ Editar Atención' : '➕ Nueva Atención'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Estudiante *</InputLabel>
                  <Select
                    name="estudiante_id"
                    value={formData.estudiante_id}
                    onChange={handleInputChange}
                    label="Estudiante *"
                  >
                    {estudiantes.map((e) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Paciente *</InputLabel>
                  <Select
                    name="paciente_id"
                    value={formData.paciente_id}
                    onChange={handleInputChange}
                    label="Paciente *"
                  >
                    {pacientes.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  label="Fecha"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="diagnostico"
                  value={formData.diagnostico}
                  onChange={handleInputChange}
                  label="Diagnóstico"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="tratamiento"
                  value={formData.tratamiento}
                  onChange={handleInputChange}
                  label="Tratamiento"
                  multiline
                  rows={3}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  label="Observaciones"
                  multiline
                  rows={2}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    label="Estado"
                  >
                    <MenuItem value="completada">✓ Completada</MenuItem>
                    <MenuItem value="pendiente">⏳ Pendiente</MenuItem>
                  </Select>
                </FormControl>
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

export default RegistroAtenciones;