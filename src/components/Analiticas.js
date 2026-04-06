import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  LinearProgress,
  Alert,
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
} from 'recharts';
import {
  Groups as GroupsIcon,
  PersonAddAlt as PersonAddIcon,
  MedicalServicesOutlined as MedicalIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';

const Analiticas = () => {
  const [stats, setStats] = useState({
    docentes: 0,
    estudiantes: 0,
    pacientes: 0,
    atenciones: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDirector } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!isDirector()) {
        navigate('/dashboard', { replace: true });
        return;
      }

      try {
        setLoading(true);
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

        const semesterStats = (estudiantes || []).reduce((acc, est) => {
          const sem = `S${est.semestre_actual}`;
          if (!acc[sem]) acc[sem] = { semestre: sem, estudiantes: 0, atenciones: 0 };
          acc[sem].estudiantes += 1;
          acc[sem].atenciones += atenciones?.filter((a) => a.estudiante_id === est.id).length || 0;
          return acc;
        }, {});

        const chartDataArray = Object.values(semesterStats).sort((a, b) =>
          a.semestre.localeCompare(b.semestre)
        );

        const fullChartData = [1, 2, 3, 4, 5, 6].map((s) => {
          const name = `S${s}`;
          return (
            chartDataArray.find((d) => d.semestre === name) || {
              semestre: name,
              estudiantes: 0,
              atenciones: 0,
            }
          );
        });

        setChartData(fullChartData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDirector, navigate]);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `2px solid ${color}30`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" sx={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color, mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 48, color, opacity: 0.3 }} />
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <>
        <NavBar title="Analíticas" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Analíticas" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Vista agregada del sistema: estudiantes, pacientes y atenciones por semestre.
        </Alert>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={GroupsIcon} label="Docentes activos" value={stats.docentes} color="#3b82f6" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={PersonAddIcon} label="Estudiantes" value={stats.estudiantes} color="#8b5cf6" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={GroupsIcon} label="Pacientes" value={stats.pacientes} color="#ec4899" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={MedicalIcon} label="Atenciones" value={stats.atenciones} color="#f59e0b" />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Atenciones por semestre
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
                Estudiantes por semestre
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
      </Container>
    </>
  );
};

export default Analiticas;
