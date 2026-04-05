import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
  TextField,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

/**
 * ProfessionalTable - Tabla profesional reutilizable
 * @param {Array} columns - Configuración de columnas
 * @param {Array} data - Datos a mostrar
 * @param {Function} onEdit - Callback para editar
 * @param {Function} onDelete - Callback para eliminar
 * @param {Function} onView - Callback para ver detalles
 * @param {Boolean} showSearch - Mostrar búsqueda
 */
const ProfessionalTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  showSearch = true,
  title = 'Datos',
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filtrado
  const filteredData = data.filter((row) =>
    columns.some((col) =>
      String(row[col.field])
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetail = (row) => {
    setSelectedRow(row);
    setDialogOpen(true);
  };

  const getStatusChip = (value) => {
    if (value === 'activo') {
      return <Chip label="✓ Activo" color="success" size="small" />;
    }
    if (value === 'retirado') {
      return <Chip label="✗ Retirado" color="error" size="small" />;
    }
    if (value === true) {
      return <Chip label="Sí" color="success" size="small" />;
    }
    if (value === false) {
      return <Chip label="No" color="default" size="small" />;
    }
    return value;
  };

  return (
    <>
      {showSearch && (
        <TextField
          placeholder={`Buscar en ${title}...`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{ mb: 2, width: '100%' }}
          size="small"
        />
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.field}
                  sx={{
                    fontWeight: 'bold',
                    color: '#333',
                    borderBottom: '2px solid #ddd',
                  }}
                  align={col.align || 'left'}
                >
                  {col.header}
                </TableCell>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableCell sx={{ fontWeight: 'bold', color: '#333', borderBottom: '2px solid #ddd' }}>
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, idx) => (
                <TableRow
                  key={idx}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f9f9f9',
                    },
                    '&:last-child td': { border: 0 },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.field} align={col.align || 'left'}>
                      {col.type === 'status'
                        ? getStatusChip(row[col.field])
                        : col.render
                        ? col.render(row[col.field], row)
                        : row[col.field]}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {onView && (
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewDetail(row)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onEdit(row)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(row)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Modal de detalles */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles</DialogTitle>
        <DialogContent>
          {selectedRow && (
            <Box sx={{ mt: 2 }}>
              {columns.map((col) => (
                <Box key={col.field} sx={{ mb: 2 }}>
                  <strong>{col.header}:</strong>{' '}
                  {col.type === 'status'
                    ? getStatusChip(selectedRow[col.field])
                    : col.render
                    ? col.render(selectedRow[col.field], selectedRow)
                    : selectedRow[col.field]}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfessionalTable;