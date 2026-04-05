import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Button,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import { FileDownload, Folder } from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reportes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openPreview, setOpenPreview] = useState(false);
  const { user, isDirector } = useAuth();

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
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Encabezado
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // UV Blue
    doc.text('REPORTE CLÍNICO SEMESTRAL', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Estudiante: ${reportData.estudiante?.nombre}`, 15, yPosition);
    yPosition += 8;
    doc.text(`Semestre Actual: S${reportData.estudiante?.semestre_actual}`, 15, yPosition);
    yPosition += 8;
    doc.text(`Docente Supervisor: ${user.email}`, 15, yPosition);
    yPosition += 8;
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-CO')}`, 15, yPosition);

    yPosition += 15;
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text('RESUMEN DE ACTIVIDAD', 15, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`• Total de Pacientes Activos: ${reportData.pacientes.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`• Total de Atenciones Realizadas: ${reportData.atenciones.length}`, 20, yPosition);

    // Tabla de Pacientes
    yPosition += 15;
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text('LISTADO DE PACIENTES', 15, yPosition);
    
    const pacientesData = reportData.pacientes.map((p, index) => [
      index + 1,
      p.nombre,
      p.edad,
      p.diagnostico?.substring(0, 50),
      p.quirurgico ? 'Sí' : 'No'
    ]);

    doc.autoTable({
      head: [['#', 'Nombre del Paciente', 'Edad', 'Diagnóstico', 'Quirúrgico']],
      body: pacientesData,
      startY: yPosition + 5,
      margin: 15,
      styles: { fontSize: 9 },
      headStyles: { fillStyle: [30, 58, 138] }
    });

    // Firma (al final de la última página)
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.line(15, finalY, 80, finalY);
    doc.text('Firma Docente Supervisor', 15, finalY + 7);

    doc.save(`reporte_${reportData.estudiante?.nombre.replace(/\s/g, '_')}.pdf`);
  };

  const exportExcel = () => {
    if (!reportData) return;

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen del Estudiante
    const resumenData = [
      ['REPORTE CLÍNICO SEMESTRAL'],
      ['Estudiante', reportData.estudiante?.nombre],
      ['Semestre', `S${reportData.estudiante?.semestre_actual}`],
      ['Fecha Reporte', new Date().toLocaleDateString('es-CO')],
      [],
      ['INDICADORES'],
      ['Total Pacientes', reportData.pacientes.length],
      ['Total Atenciones', reportData.atenciones.length]
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja 2: Pacientes
    const wsPacientes = XLSX.utils.json_to_sheet(reportData.pacientes.map(p => ({
      Nombre: p.nombre,
      Telefono: p.telefono,
      Edad: p.edad,
      Diagnostico: p.diagnostico,
      Maloclusion: p.tipo_maloclusion,
      Quirurgico: p.quirurgico ? 'SÍ' : 'NO',
      Extracciones: p.extracciones ? 'SÍ' : 'NO',
      Notas: p.notas,
      Ingreso: p.fecha_ingreso
    })));
    XLSX.utils.book_append_sheet(wb, wsPacientes, 'Pacientes');

    // Hoja 3: Atenciones
    const wsAtenciones = XLSX.utils.json_to_sheet(reportData.atenciones.map(a => ({
      Fecha: a.fecha,
      PacienteID: a.paciente_id,
      Procedimiento: a.procedimiento,
      Observaciones: a.observaciones,
      Semestre: a.semestre
    })));
    XLSX.utils.book_append_sheet(wb, wsAtenciones, 'Atenciones');

    // Descargar archivo
    XLSX.writeFile(wb, `reporte_${reportData.estudiante?.nombre.replace(/\s/g, '_')}.xlsx`);
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
                  Descargar Excel
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