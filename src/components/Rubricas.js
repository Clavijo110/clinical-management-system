import React, { useEffect, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const Rubricas = () => {
  const [rubricas, setRubricas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const { isDirector } = useAuth();

  const [formData, setFormData] = useState({
    semestre: 1,
    criterios_minimos: '',
    calidad_esperada: '',
    observaciones: '',
  });

  useEffect(() => {
    fetchRubricas();
  }, []);

  const fetchRubricas = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase.from('rubricas').select('*');
      if (err) throw err;
      setRubricas(data || []);
    } catch (error) {
      setError(`Error al cargar rúbricas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditId(item.id);
      setFormData(item);
    } else {
      setEditId(null);
      setFormData({
        semestre: 1,
        criterios_minimos: '',
        calidad_esperada: '',
        observaciones: '',
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
      if (!formData.semestre || !formData.criterios_minimos) {
        setError('Por favor completa los campos obligatorios');
        return;
      }

      if (editId) {
        const { error: err } = await supabase
          .from('rubricas')
          .update(formData)
          .eq('id', editId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('rubricas')
          .insert([formData]);
        if (err) throw err;
      }

      fetchRubricas();
      handleCloseDialog();
    } catch (error) {
      setError(`Error al guardar: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta rúbrica?')) return;
    try {
      const { error: err } = await supabase
        .from('rubricas')
        .delete()
        .eq('id', id);
      if (err) throw err;
      fetchRubricas();
    } catch (error) {
      setError(`Error al eliminar: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <>
        <NavBar title="Rúbricas de Evaluación" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Rúbricas de Evaluación" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isDirector && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Nueva Rúbrica
            </Button>
          </Box>
        )}

        {rubricas.length === 0 ? (
          <Alert severity="info">No hay rúbricas definidas</Alert>
        ) : (
          <Grid container spacing={3}>
            {rubricas.map((rubrica) => (
              <Grid item xs={12} md={6} key={rubrica.id}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, #667eea15 0%, #764ba215 100%)`,
                    border: '2px solid #667eea30',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px #667eea30',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5">
                        Semestre {rubrica.semestre}
                      </Typography>
                      <Chip label={`S${rubrica.semestre}`} color="primary" />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        📋 Criterios Mínimos:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {rubrica.criterios_minimos}
                      </Typography>
                    </Box>

                    {rubrica.calidad_esperada && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          ⭐ Calidad Esperada:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {rubrica.calidad_esperada}
                        </Typography>
                      </Box>
                    )}

                    {rubrica.observaciones && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          📝 Observaciones:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {rubrica.observaciones}
                        </Typography>
                      </Box>
                    )}

                    {isDirector && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(rubrica)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(rubrica.id)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Dialog para crear/editar */}
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>
            {editId ? '✏️ Editar Rúbrica' : '➕ Nueva Rúbrica'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleInputChange}
                  label="Semestre *"
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="criterios_minimos"
                  value={formData.criterios_minimos}
                  onChange={handleInputChange}
                  label="Criterios Mínimos *"
                  multiline
                  rows={3}
                  placeholder="Ej: 10 atenciones, 5 pacientes diferentes, etc."
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="calidad_esperada"
                  value={formData.calidad_esperada}
                  onChange={handleInputChange}
                  label="Calidad Esperada"
                  multiline
                  rows={3}
                  placeholder="Especifica los estándares de calidad"
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

export default Rubricas;