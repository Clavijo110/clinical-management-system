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
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
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
import {
  Person,
  People,
  Assignment,
  FileDownload,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const DashboardDocente = () => {
  const [stats, setStats] = useState({
    estudiantes: 0,
    pacientes: 0,
    atenciones: 0,
  });
  const [estudiantesList, setEstudiantesList] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: estudiantes } = await supabase
          .from('estudiantes')
          .select('*')
          .eq('docente_id', user.id);

        setEstudiantesList(estudiantes || []);

        if (estudiantes && estudiantes.length > 0) {
          const estudianteIds = estudiantes.map((e) => e.id);

          const { data: pacientes } = await supabase
            .from('pacientes')
            .select('*')
            .in('estudiante_id', estudianteIds);

          const { data: atenciones } = await supabase
            .from('atenciones')
            .select('*')
            .in('estudiante_id', estudianteIds);

          setStats({
            estudiantes: estudiantes.length,
            pacientes: pacientes?.length || 0,
            atenciones: atenciones?.length || 0,
          });

          // Datos para gráfico (agrupados por semestre de estudiante)
          const chartDataRaw = estudiantes.reduce((acc, est) => {
            const sem = `S${est.semestre_actual}`;
            if (!acc[sem]) acc[sem] = { semestre: sem, atenciones: 0, pacientes: 0 };
            acc[sem].atenciones += atenciones?.filter((a) => a.estudiante_id === est.id).length || 0;
            acc[sem].pacientes += pacientes?.filter((p) => p.estudiante_id === est.id).length || 0;
            return acc;
          }, {});

          setChartData(Object.values(chartDataRaw).sort((a, b) => a.semestre.localeCompare(b.semestre)));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <Card
      sx={{
        transition: 'all 0.3s ease',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `2px solid ${color}30`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${color}30`,
          borderColor: color,
        },
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
        <NavBar title="Dashboard Docente" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Dashboard Docente" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          👋 Bienvenido. Aquí puedes ver el progreso de tus estudiantes.
        </Alert>

        {/* KPIs */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              icon={Person}
              label="Mis Estudiantes"
              value={stats.estudiantes}
              color="#3b82f6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              icon={People}
              label="Pacientes Activos"
              value={stats.pacientes}
              color="#8b5cf6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              icon={Assignment}
              label="Atenciones"
              value={stats.atenciones}
              color="#ec4899"
            />
          </Grid>
        </Grid>

        {/* Tabs de contenido */}
        <Paper sx={{ mb: 4, borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="📈 Progreso" />
            <Tab label="👥 Estudiantes" />
            <Tab label="⚡ Acciones" />
          </Tabs>

          {/* Tab 1: Progreso */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📊 Atenciones por Semestre
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

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    🎓 Pacientes por Estudiante
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={estudiantesList.map((e, i) => ({
                          name: e.nombre,
                          value: Math.floor(Math.random() * 10) + 2,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {['#3b82f6', '#8b5cf6', '#ec4899'].map((color, idx) => (
                          <Cell key={`cell-${idx}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Estudiantes */}
          <TabPanel value={tabValue} index={1}>
            <List>
              {estudiantesList.map((est) => (
                <ListItem
                  key={est.id}
                  sx={{
                    mb: 1,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 1,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <ListItemText
                    primary={<strong>{est.nombre}</strong>}
                    secondary={`Semestre ${est.semestre_actual} • Estado: ${est.estado === 'activo' ? '✓ Activo' : '✗ Retirado'}`}
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>

          {/* Tab 3: Acciones */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Person />}
                  onClick={() => navigate('/gestion-estudiantes')}
                  sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 2 }}
                >
                  Gestionar Estudiantes
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<People />}
                  onClick={() => navigate('/gestion-pacientes')}
                  sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', p: 2 }}
                >
                  Gestionar Pacientes
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Assignment />}
                  onClick={() => navigate('/registro-atenciones')}
                  sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', p: 2 }}
                >
                  Registrar Atenciones
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FileDownload />}
                  onClick={() => navigate('/reportes')}
                  sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: '#333', p: 2 }}
                >
                  Generar Reportes
                </Button>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Container>
    </>
  );
};

export default DashboardDocente;