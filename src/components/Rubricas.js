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
import ProfessionalForm from './ProfessionalForm';
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

  const formFields = [
    {
      name: 'semestre',
      label: 'Semestre',
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
    { name: 'criterios_minimos', label: 'Criterios Mínimos', required: true, multiline: true, rows: 3, fullWidth: true },
    { name: 'calidad_esperada', label: 'Calidad Esperada', multiline: true, rows: 2, fullWidth: true },
    { name: 'observaciones', label: 'Observaciones', multiline: true, rows: 2, fullWidth: true },
  ];

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
    } else {
      setEditId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleSave = async (formData) => {
    try {
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

        {isDirector() && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}
            >
              Nueva Rúbrica
            </Button>
          </Box>
        )}

        <Grid container spacing={3}>
          {rubricas.map((rubrica) => (
            <Grid item xs={12} md={6} key={rubrica.id}>
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip label={`Semestre ${rubrica.semestre}`} color="primary" />
                    {isDirector() && (
                      <Box>
                        <EditIcon
                          sx={{ cursor: 'pointer', mr: 1, color: 'text.secondary' }}
                          onClick={() => handleOpenDialog(rubrica)}
                        />
                        <DeleteIcon
                          sx={{ cursor: 'pointer', color: 'error.main' }}
                          onClick={() => handleDelete(rubrica.id)}
                        />
                      </Box>
                    )}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Criterios Mínimos
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {rubrica.criterios_minimos}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Calidad Esperada
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {rubrica.calidad_esperada}
                  </Typography>
                  {rubrica.observaciones && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Observaciones
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rubrica.observaciones}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <ProfessionalForm
          open={openDialog}
          title={editId ? 'Editar Rúbrica' : 'Nueva Rúbrica'}
          fields={formFields}
          initialData={editId ? rubricas.find(r => r.id === editId) : null}
          onClose={handleCloseDialog}
          onSubmit={handleSave}
          loading={loading}
          error={error}
        />
      </Container>
    </>
  );
};

export default Rubricas;