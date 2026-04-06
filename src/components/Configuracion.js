import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  TextField,
  Grid,
  LinearProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NavBar from './NavBar';
import { supabase } from '../supabaseClient';

const DEFAULT_SETTINGS = {
  nombre_institucion: 'Universidad del Valle',
  programa: 'Posgrado de Ortodoncia',
  limite_pacientes: 10,
  permitir_registro_docentes: true,
  notificaciones_email: false,
};

const LOCAL_STORAGE_KEY = 'cms_configuracion_local';

const Configuracion = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const mergeSettings = useCallback((raw) => {
    if (!raw || typeof raw !== 'object') return;
    setSettings((prev) => ({
      ...prev,
      nombre_institucion: raw.nombre_institucion ?? prev.nombre_institucion,
      programa: raw.programa ?? prev.programa,
      limite_pacientes:
        raw.limite_pacientes != null ? Number(raw.limite_pacientes) : prev.limite_pacientes,
      permitir_registro_docentes:
        typeof raw.permitir_registro_docentes === 'boolean'
          ? raw.permitir_registro_docentes
          : prev.permitir_registro_docentes,
      notificaciones_email:
        typeof raw.notificaciones_email === 'boolean'
          ? raw.notificaciones_email
          : prev.notificaciones_email,
    }));
  }, []);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const { data, error: supaError } = await supabase
          .from('configuracion')
          .select('*')
          .maybeSingle();

        if (supaError) {
          console.warn('configuracion (Supabase):', supaError.message);
        }
        if (data) {
          mergeSettings(data);
          setInitialLoading(false);
          return;
        }

        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) mergeSettings(JSON.parse(stored));
        } catch {
          /* ignore */
        }
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [mergeSettings]);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setInfo(null);
    setError(null);

    const limite =
      settings.limite_pacientes === '' || Number.isNaN(Number(settings.limite_pacientes))
        ? DEFAULT_SETTINGS.limite_pacientes
        : Math.min(999, Math.max(1, Number(settings.limite_pacientes)));
    const normalized = { ...settings, limite_pacientes: limite };
    setSettings(normalized);
    const payload = { id: 1, ...normalized };

    try {
      const { error: upsertError } = await supabase.from('configuracion').upsert(payload);

      if (upsertError) {
        const msg = (upsertError.message || '').toLowerCase();
        const missingRelation =
          upsertError.code === '42P01' || msg.includes('relation') || msg.includes('does not exist');

        if (missingRelation) {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
            setInfo(
              'No hay tabla configuracion en Supabase. Los cambios se guardaron solo en este navegador.'
            );
            setTimeout(() => setInfo(null), 8000);
          } catch {
            setError('No se pudo guardar en el navegador ni en la base de datos.');
          }
        } else {
          setError(upsertError.message || 'No se pudo guardar la configuración.');
        }
        return;
      }

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        /* optional mirror */
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err?.message || 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? value === ''
              ? ''
              : Number(value)
            : value,
    }));
  };

  if (initialLoading) {
    return (
      <>
        <NavBar title="Configuración del Sistema" />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar title="Configuración del Sistema" />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <SettingsOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Ajustes del sistema
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuración guardada correctamente.
          </Alert>
        )}
        {info && (
          <Alert severity="info" sx={{ mb: 2 }} onClose={() => setInfo(null)}>
            {info}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Información institucional
          </Typography>
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de la institución"
                name="nombre_institucion"
                value={settings.nombre_institucion}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Programa académico"
                name="programa"
                value={settings.programa}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Parámetros clínicos
          </Typography>
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 1, max: 999 }}
                label="Límite de pacientes por residente"
                name="limite_pacientes"
                value={settings.limite_pacientes}
                onChange={handleChange}
                helperText="Máximo de pacientes activos permitidos por estudiante"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Permisos y notificaciones
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.permitir_registro_docentes}
                  onChange={handleChange}
                  name="permitir_registro_docentes"
                />
              }
              label="Permitir registro de nuevos docentes"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificaciones_email}
                  onChange={handleChange}
                  name="notificaciones_email"
                />
              }
              label="Notificaciones por correo electrónico"
            />
          </Box>

          <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
              size="large"
              sx={{ px: 4 }}
            >
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default Configuracion;
