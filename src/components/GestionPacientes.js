import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Alert,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import ProfessionalTable from './ProfessionalTable';
import ProfessionalForm from './ProfessionalForm';

const GestionPacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const { user, isDirector } = useAuth();

  const formFields = [
    { name: 'nombre', label: 'Nombre Completo', required: true, fullWidth: true },
    { name: 'telefono', label: 'Teléfono', type: 'tel' },
    { name: 'edad', label: 'Edad', type: 'number', inputProps: { min: 0, max: 100 } },
    { name: 'diagnostico', label: 'Diagnóstico', required: true, fullWidth: true },
    {
      name: 'tipo_maloclusion',
      label: 'Tipo de Maloclusión',
      type: 'select',
      required: true,
      options: [
        { value: 'Clase I', label: 'Clase I' },
        { value: 'Clase II', label: 'Clase II' },
        { value: 'Clase III', label: 'Clase III' },
        { value: 'Otro', label: 'Otro' },
      ],
    },
    { name: 'quirurgico', label: 'Caso Quirúrgico', type: 'checkbox' },
    { name: 'extracciones', label: 'Requiere Extracciones', type: 'checkbox' },
    { name: 'notas', label: 'Notas Clínicas', fullWidth: true, multiline: true, rows: 3 },
    { name: 'fecha_ingreso', label: 'Fecha de Ingreso', type: 'date' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener estudiantes
        let estudiantesQuery = supabase.from('estudiantes').select('*');
        if (!isDirector()) {
          estudiantesQuery = estudiantesQuery.eq('docente_id', user.id);
        }
        const { data: estData } = await estudiantesQuery;

        // Obtener pacientes
        let pacientesQuery = supabase.from('pacientes').select('*');
        if (!isDirector() && estData) {
          const estIds = estData.map((e) => e.id);
          pacientesQuery = pacientesQuery.in('estudiante_id', estIds);
        }
        const { data: pacData } = await pacientesQuery;
        setPacientes(pacData || []);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar pacientes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isDirector]);

  const handleAddPaciente = async (formData) => {
    try {
      setError(null);
      const pacienteData = {
        ...formData,
        estudiante_id: null,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('pacientes')
          .update(pacienteData)
          .eq('id', editingId);
        if (updateError) throw updateError;
        setPacientes(
          pacientes.map((p) => (p.id === editingId ? { ...p, ...pacienteData } : p))
        );
      } else {
        const { data, error: insertError } = await supabase
          .from('pacientes')
          .insert([pacienteData]);
        if (insertError) throw insertError;
        setPacientes([...pacientes, data[0]]);
      }

      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al guardar paciente');
    }
  };

  const handleDeletePaciente = async (row) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', row.id);
      if (deleteError) throw deleteError;
      setPacientes(pacientes.filter((p) => p.id !== row.id));
    } catch (err) {
      console.error('Error:', err);
      setError('Error al eliminar paciente');
    }
  };

  const tableColumns = [
    { field: 'nombre', header: 'Nombre', align: 'left' },
    { field: 'edad', header: 'Edad', align: 'center' },
    { field: 'diagnostico', header: 'Diagnóstico', align: 'left' },
    { field: 'tipo_maloclusion', header: 'Maloclusión', align: 'center' },
    {
      field: 'quirurgico',
      header: 'Quirúrgico',
      type: 'status',
      align: 'center',
    },
    {
      field: 'extracciones',
      header: 'Extracciones',
      type: 'status',
      align: 'center',
    },
    { field: 'telefono', header: 'Teléfono', align: 'left' },
  ];

  if (loading) {
    return (
      <>
        <NavBar title="Gestión de Pacientes" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Gestión de Pacientes" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                📋 Gestión de Pacientes
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total: {pacientes.length} pacientes
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingId(null);
                setFormOpen(true);
              }}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Agregar Paciente
            </Button>
          </Box>

          <ProfessionalTable
            columns={tableColumns}
            data={pacientes}
            onEdit={(row) => {
              setEditingId(row.id);
              setFormOpen(true);
            }}
            onDelete={handleDeletePaciente}
            title="Pacientes"
          />
        </Paper>

        <ProfessionalForm
          open={formOpen}
          title={editingId ? 'Editar Paciente' : 'Agregar Nuevo Paciente'}
          fields={formFields}
          onClose={() => {
            setFormOpen(false);
            setEditingId(null);
          }}
          onSubmit={handleAddPaciente}
        />
      </Container>
    </>
  );
};

export default GestionPacientes;