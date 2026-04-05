import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Alert,
  Box,
  Avatar,
  IconButton,
  Typography,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * ProfessionalForm - Diálogo de formulario profesional reutilizable
 */
const ProfessionalForm = ({
  open,
  title,
  onClose,
  onSubmit,
  fields,
  initialData = null,
  loading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    // Inicializar valores
    const initial = {};
    fields.forEach((field) => {
      if (initialData && initialData[field.name] !== undefined) {
        initial[field.name] = initialData[field.name];
      } else {
        initial[field.name] = field.defaultValue || (field.type === 'checkbox' ? false : '');
      }
    });
    setFormData(initial);
    setErrors({});
    setPreviewImage(initialData?.foto || null);
  }, [open, fields, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Limpiar error cuando usuario empieza a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, foto: 'La imagen debe ser menor a 2MB' });
        return;
      }
      setFormData({ ...formData, fotoFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    setFormData({ ...formData, fotoFile: null, foto: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} es requerido`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', background: '#f5f5f5' }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          {fields.map((field) => (
            <Grid item xs={field.fullWidth ? 12 : 6} key={field.name}>
              {field.type === 'image' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 1, width: '100%' }}>
                    {field.label}
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={previewImage}
                      sx={{ width: 100, height: 100, border: '1px solid #ddd' }}
                    >
                      {!previewImage && <PhotoCameraIcon />}
                    </Avatar>
                    <Box sx={{ position: 'absolute', bottom: -10, right: -10, display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        sx={{ backgroundColor: 'white', border: '1px solid #ddd', '&:hover': { backgroundColor: '#f5f5f5' } }}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                      {previewImage && (
                        <IconButton
                          size="small"
                          color="error"
                          sx={{ backgroundColor: 'white', border: '1px solid #ddd', '&:hover': { backgroundColor: '#fff' } }}
                          onClick={removeImage}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {errors.foto && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.foto}
                    </Typography>
                  )}
                </Box>
              ) : field.type === 'checkbox' ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      name={field.name}
                      checked={formData[field.name] || false}
                      onChange={handleChange}
                    />
                  }
                  label={field.label}
                />
              ) : field.type === 'select' ? (
                <TextField
                  select
                  name={field.name}
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
                  fullWidth
                  required={field.required}
                  size="small"
                >
                  {field.options?.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  name={field.name}
                  label={field.label}
                  type={field.type || 'text'}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
                  fullWidth
                  required={field.required}
                  inputProps={field.inputProps}
                  multiline={field.multiline}
                  rows={field.rows || 1}
                  size="small"
                />
              )}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, background: '#f5f5f5' }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfessionalForm;