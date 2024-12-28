import React, { useState } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { ExcelRenderer } from 'react-excel-renderer';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

const PCAPlot = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [plotData, setPlotData] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [explainedVariance, setExplainedVariance] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plotType, setPlotType] = useState('scatter'); // Default plot type

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : '');
    setError(null);

    // Parse the file using ExcelRenderer
    ExcelRenderer(selectedFile, (err, resp) => {
      if (err) {
        setError('Failed to read file. Please ensure it is a valid CSV or Excel file.');
        return;
      }
      const previewData = resp.rows.slice(0, 6); // First 5 rows + header
      setCsvPreview(previewData);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('datafile', file);

    setLoading(true);
    try {
      const response = await axios.post('https://metadata-dr-backend.onrender.com/pca', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status) {
        const { data, explained_variance } = response.data;
        setPlotData(data);
        setExplainedVariance(explained_variance);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePlotTypeChange = (event, newType) => {
    if (newType) {
      setPlotType(newType);
    }
  };

  const togglePreview = () => {
    setShowPreview((prev) => !prev);
  };

  const renderPlot = () => {
    if (!plotData) return null;

    switch (plotType) {
      case 'scatter':
        return (
          <Plot
            data={[
              {
                x: plotData.data.map((point) => point[0]),
                y: plotData.data.map((point) => point[1]),
                type: 'scatter',
                mode: 'markers',
                marker: { color: 'blue' },
              },
            ]}
            layout={{
              width: 800,
              height: 600,
              title: 'PCA Results (Scatter Plot)',
              xaxis: { title: 'PC1' },
              yaxis: { title: 'PC2' },
            }}
          />
        );

      case 'bar':
        return (
          <Plot
            data={[
              {
                x: plotData.data.map((_, index) => `Point ${index + 1}`),
                y: plotData.data.map((point) => point[0]),
                type: 'bar',
                marker: { color: 'green' },
              },
            ]}
            layout={{
              width: 800,
              height: 600,
              title: 'PCA Results (Bar Plot)',
              xaxis: { title: 'Data Points' },
              yaxis: { title: 'PC1' },
            }}
          />
        );

      case '3d':
        return (
          <Plot
            data={[
              {
                x: plotData.data.map((point) => point[0]),
                y: plotData.data.map((point) => point[1]),
                z: plotData.data.map((point) => point[2] || 0),
                type: 'scatter3d',
                mode: 'markers',
                marker: { color: 'red', size: 4 },
              },
            ]}
            layout={{
              width: 800,
              height: 600,
              title: 'PCA Results (3D Scatter Plot)',
              scene: {
                xaxis: { title: 'PC1' },
                yaxis: { title: 'PC2' },
                zaxis: { title: 'PC3' },
              },
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container sx={{ borderRadius: 1, bgcolor: 'white', p: 3, boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Dimensionality Reduction - PCA Analysis
      </Typography>
      <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, textAlign: 'center', boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom>
          Upload a CSV or Excel file for PCA Analysis
        </Typography>
        <form onSubmit={handleSubmit}>
          <Button
            variant="contained"
            component="label"
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Select File
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              hidden
            />
          </Button>
          {fileName && <Typography variant="body2">Selected File: {fileName}</Typography>}
          <br />
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            sx={{ textTransform: 'none' }}
          >
            Analyze
          </Button>
        </form>
        {csvPreview && (
          <Button
            variant="outlined"
            onClick={togglePreview}
            sx={{ mt: 2, textTransform: 'none' }}
          >
            {showPreview ? 'Hide' : 'Show'} CSV Preview
          </Button>
        )}
        {showPreview && csvPreview && (
          <TableContainer component={Paper} sx={{ mt: 2, border: 1, borderColor: 'grey.400' }}>
            <Table size="small" aria-label="CSV Preview" sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow>
                  {csvPreview[0]?.map((header, index) => (
                    <TableCell
                      key={index}
                      sx={{
                        border: 1,
                        borderColor: 'grey.400',
                        fontWeight: 'bold',
                        textAlign: 'center',
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {csvPreview.slice(1).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <TableCell
                        key={colIndex}
                        sx={{
                          border: 1,
                          borderColor: 'grey.300',
                          textAlign: 'center',
                        }}
                      >
                        {cell || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
                {loading && <LinearProgress sx={{ mt: 2 }} />}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {explainedVariance && (
                    <Typography sx={{ mt: 2 }}>
                        Explained Variance: {(explainedVariance * 100).toFixed(2)}%
                    </Typography>
                )}
            </Box>

            {plotData && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <ToggleButtonGroup
                        value={plotType}
                        exclusive
                        onChange={handlePlotTypeChange}
                        aria-label="plot type"
                        sx={{ mb: 2 }}
                    >
                        <ToggleButton value="scatter" aria-label="Scatter Plot">
                            Scatter Plot
                        </ToggleButton>
                        <ToggleButton value="bar" aria-label="Bar Plot">
                            Bar Plot
                        </ToggleButton>
                        <ToggleButton value="3d" aria-label="3D Scatter Plot">
                            3D Scatter Plot
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {renderPlot()}
                </Box>
            )}
        </Container>
    );
};

export default PCAPlot;
