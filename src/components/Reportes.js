import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Button,
  Box,
  Typography,
  Grid,
  LinearProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import { FileDownload, Folder } from '@mui/icons-material';
import jsPDF from 'jspdf';

const Reportes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openPreview, setOpenPreview] = useState(false);
  const { user, isDirector } = useAuth();

  useEffect(() => {
    fetchEstudiantes();
  }, [user]);

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

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: estData } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('id', selectedEstudianteId)
        .single();

      const { data: pacientes } = await supabase
        .from('pacientes')
        .select('*')
        .eq('estudiante_id', selectedEstudianteId);

      const { data: atenciones } = await supabase
        .from('atenciones')
        .select('*')
        .eq('estudiante_id', selectedEstudianteId);

      // Procesar datos para gráficos
      const atencionesPorMes = {};
      atenciones?.forEach((a) => {
        const mes = a.fecha?.substring(0, 7) || 'Sin fecha';
        atencionesPorMes[mes] = (atencionesPorMes[mes] || 0) + 1;
      });

      const chartData = Object.entries(atencionesPorMes).map(([mes, count]) => ({
        mes,
        atenciones: count,
      }));

      setReportData({
        estudiante: estData,
        pacientes: pacientes || [],
        atenciones: atenciones || [],
        chartData,
      });

      setOpenPreview(true);
    } catch (error) {
      setError(`Error al generar reporte: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 15;

    // Encabezado
    doc.setFontSize(18);
    doc.text('REPORTE DE ESTUDIANTE', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 12;
    doc.setFontSize(10);
    doc.text(`Estudiante: ${reportData.estudiante?.nombre}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Semestre: ${reportData.estudiante?.semestre_actual}`, 15, yPosition);
    yPosition += 6;
    doc.text(
      `Fecha de Reporte: ${new Date().toLocaleDateString('es-CO')}`,
      15,
      yPosition
    );

    yPosition += 12;
    doc.setFontSize(12);
    doc.text('RESUMEN', 15, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.text(
      `Total Pacientes: ${reportData.pacientes.length}`,
      15,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Total Atenciones: ${reportData.atenciones.length}`,
      15,
      yPosition
    );

    // Atenciones
    yPosition += 12;
    doc.setFontSize(12);
    doc.text('ATENCIONES REGISTRADAS', 15, yPosition);
    yPosition += 8;

    const atencionesData = reportData.atenciones.slice(0, 5).map((a) => [
      a.fecha,
      a.diagnostico?.substring(0, 20),
      a.estado,
    ]);

    doc.autoTable({
      head: [['Fecha', 'Diagnóstico', 'Estado']],
      body: atencionesData,
      startY: yPosition,
      margin: 15,
    });

    doc.save(`reporte_${reportData.estudiante?.nombre.replace(/\s/g, '_')}.pdf`);
  };

  const exportExcel = () => {
    if (!reportData) return;

    // Simple CSV export
    const headers = ['Fecha', 'Diagnóstico', 'Tratamiento', 'Estado'];
    const rows = reportData.atenciones.map((a) => [
      a.fecha,
      a.diagnostico,
      a.tratamiento,
      a.estado,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${reportData.estudiante?.nombre.replace(/\s/g, '_')}.csv`;
    a.click();
  };

  if (loading && !reportData) {
    return (
      <>
        <NavBar title="Reportes" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Reportes" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth>
                <InputLabel>Selecciona un Estudiante</InputLabel>
                <Select
                  value={selectedEstudianteId}
                  onChange={(e) => setSelectedEstudianteId(e.target.value)}
                  label="Selecciona un Estudiante"
                >
                  {estudiantes.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.nombre} (S{e.semestre_actual})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={generateReport}
                disabled={!selectedEstudianteId || loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 1.75 }}
                startIcon={<Folder />}
              >
                Generar Reporte
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {reportData && (
          <>
            {/* Preview Dialog */}
            <Dialog
              open={openPreview}
              onClose={() => setOpenPreview(false)}
              fullWidth
              maxWidth="md"
            >
              <DialogTitle>
                📋 Reporte: {reportData.estudiante?.nombre}
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                  {/* Estadísticas */}
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 1 }}>
                          Total Pacientes
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#667eea', fontWeight: 'bold' }}>
                          {reportData.pacientes.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ background: 'linear-gradient(135deg, #764ba215 0%, #8b5cf615 100%)' }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 1 }}>
                          Total Atenciones
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                          {reportData.atenciones.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Gráficos */}
                  {reportData.chartData.length > 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Atenciones por Mes
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={reportData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="atenciones" fill="#667eea" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenPreview(false)}>Cerrar</Button>
                <Button
                  onClick={exportPDF}
                  variant="contained"
                  startIcon={<FileDownload />}
                  sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                >
                  Descargar PDF
                </Button>
                <Button
                  onClick={exportExcel}
                  variant="contained"
                  startIcon={<FileDownload />}
                  sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
                >
                  Descargar CSV
                </Button>
              </DialogActions>
            </Dialog>

            {/* Summary Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                      Estudiante
                    </Typography>
                    <Typography variant="h5">
                      {reportData.estudiante?.nombre}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                      Pacientes
                    </Typography>
                    <Typography variant="h5">
                      {reportData.pacientes.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                      Atenciones
                    </Typography>
                    <Typography variant="h5">
                      {reportData.atenciones.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </>
  );
};

export default Reportes;