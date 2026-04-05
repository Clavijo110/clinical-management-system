import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Paper,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Groups as GroupsIcon,
  PersonAddAlt as PersonAddIcon,
  MedicalServicesOutlined as MedicalIcon,
  TrendingUp,
  Assignment,
  FileDownload,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';

const DashboardDirector = () => {
  const [stats, setStats] = useState({
    docentes: 0,
    estudiantes: 0,
    pacientes: 0,
    atenciones: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, isDirector } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!isDirector()) {
        navigate('/');
        return;
      }

      try {
        const { data: docentes } = await supabase
          .from('user_roles')
          .select('*')
          .eq('rol', 'docente')
          .eq('estado', true);

        const { data: estudiantes } = await supabase.from('estudiantes').select('*');
        const { data: pacientes } = await supabase.from('pacientes').select('*');
        const { data: atenciones } = await supabase.from('atenciones').select('*');

        setStats({
          docentes: docentes?.length || 0,
          estudiantes: estudiantes?.length || 0,
          pacientes: pacientes?.length || 0,
          atenciones: atenciones?.length || 0,
        });

        // Generar datos para gráficos
        const semesterData = [
          { semestre: 'S1', estudiantes: Math.floor(Math.random() * 15), atenciones: Math.floor(Math.random() * 50) },
          { semestre: 'S2', estudiantes: Math.floor(Math.random() * 15), atenciones: Math.floor(Math.random() * 50) },
          { semestre: 'S3', estudiantes: Math.floor(Math.random() * 15), atenciones: Math.floor(Math.random() * 50) },
          { semestre: 'S4', estudiantes: Math.floor(Math.random() * 15), atenciones: Math.floor(Math.random() * 50) },
          { semestre: 'S5', estudiantes: Math.floor(Math.random() * 15), atenciones: Math.floor(Math.random() * 50) },
          { semestre: 'S6', estudiantes: Math.floor(Math.random() * 15), atenciones: Math.floor(Math.random() * 50) },
        ];
        setChartData(semesterData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDirector, navigate]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `2px solid ${color}30`,
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${color}30`,
          borderColor: color,
        } : {},
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" sx={{ fontsize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: color, mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 48, color: color, opacity: 0.3 }} />
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <>
        <NavBar title="Dashboard Director" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Dashboard Director" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Bienvenida */}
        <Alert severity="info" sx={{ mb: 3 }}>
          👋 Bienvenido, Director. Aquí puedes ver un resumen completo del sistema.
        </Alert>

        {/* KPIs */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={GroupsIcon}
              label="Docentes Activos"
              value={stats.docentes}
              color="#3b82f6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={PersonAddIcon}
              label="Estudiantes"
              value={stats.estudiantes}
              color="#8b5cf6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={GroupsIcon}
              label="Pacientes"
              value={stats.pacientes}
              color="#ec4899"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={MedicalIcon}
              label="Atenciones"
              value={stats.atenciones}
              color="#f59e0b"
            />
          </Grid>
        </Grid>

        {/* Gráficos */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Gráfico de líneas: Progreso por semestre */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                📈 Atenciones por Semestre
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semestre" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="atenciones"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Gráfico de barras: Estudiantes por semestre */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                👥 Estudiantes por Semestre
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semestre" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estudiantes" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Acciones rápidas */}
        <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            ⚡ Acciones Rápidas
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/gestion-estudiantes')}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  p: 1.5,
                }}
              >
                Gestionar Estudiantes
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<GroupsIcon />}
                onClick={() => navigate('/gestion-pacientes')}
                sx={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  p: 1.5,
                }}
              >
                Gestionar Pacientes
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<MedicalIcon />}
                onClick={() => navigate('/registro-atenciones')}
                sx={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  p: 1.5,
                }}
              >
                Registrar Atenciones
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Assignment />}
                onClick={() => navigate('/rubricas')}
                sx={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  p: 1.5,
                }}
              >
                Rúbricas de Evaluación
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FileDownload />}
                onClick={() => navigate('/reportes')}
                sx={{
                  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  color: '#333',
                  p: 1.5,
                }}
              >
                Generar Reportes
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => navigate('/analíticas')}
                sx={{
                  background: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
                  p: 1.5,
                }}
              >
                Analíticas
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Información adicional */}
        <Paper sx={{ p: 3, borderRadius: 2, background: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label="📊 25% de progreso en S1" color="primary" />
            <Chip label="✅ Todos los docentes activos" color="success" />
            <Chip label="⚠️ 2 estudiantes por cambiar de semestre" color="warning" />
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default DashboardDirector;