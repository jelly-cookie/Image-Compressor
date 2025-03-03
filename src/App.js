import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  Slider,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import imageCompression from 'browser-image-compression';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: "'Noto Sans KR', sans-serif",
  },
});

const DropZone = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  border: '2px dashed #ccc',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(33, 150, 243, 0.04)',
  },
}));

const ImagePreview = styled('img')({
  maxWidth: '100%',
  maxHeight: '300px',
  objectFit: 'contain',
  marginTop: '16px',
  borderRadius: '8px',
});

const compressionOptions = [
  { label: '10%', value: 90 },
  { label: '25%', value: 75 },
  { label: '50%', value: 50 },
  { label: '75%', value: 25 },
];

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [compressedUrls, setCompressedUrls] = useState([]);
  const [compressionValue, setCompressionValue] = useState(50);
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedChip, setSelectedChip] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = (files) => {
    if (files.length > 0) {
      setSelectedFiles(files);
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      setCompressedUrls([]);
    }
  };

  const handleCompress = async () => {
    if (selectedFiles.length === 0) return;

    setIsCompressing(true);
    try {
      const compressPromises = selectedFiles.map(async (file) => {
        const options = {
          maxSizeMB: Math.max(1, file.size / (1024 * 1024) * (1 - compressionValue / 100)), // 압축률에 따라 maxSizeMB 조정
          useWebWorker: true,
          maxWidthOrHeight: 1920,
          quality: (100 - compressionValue) / 100,
        };

        const compressedFile = await imageCompression(file, options);
        return {
          url: URL.createObjectURL(compressedFile),
          file: compressedFile,
          originalName: file.name
        };
      });

      const compressedResults = await Promise.all(compressPromises);
      setCompressedUrls(compressedResults);
    } catch (error) {
      console.error('압축 중 오류가 발생했습니다:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleChipClick = (value) => {
    setSelectedChip(value);
    setCompressionValue(value);
  };

  const handleSliderChange = (event, newValue) => {
    setCompressionValue(newValue);
    setSelectedChip(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          이미지 압축 도구
        </Typography>

        <DropZone
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          elevation={0}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(Array.from(e.target.files))}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              이미지 선택
            </Button>
          </label>
          <Typography variant="body1" color="textSecondary">
            또는 이미지를 여기에 드래그 앤 드롭하세요
          </Typography>
        </DropZone>

        {previewUrls.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              압축 옵션
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {compressionOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => handleChipClick(option.value)}
                  color={selectedChip === option.value ? 'primary' : 'default'}
                  variant={selectedChip === option.value ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
            <Typography gutterBottom>
              압축률: {compressionValue}%
            </Typography>
            <Slider
              value={compressionValue}
              onChange={handleSliderChange}
              aria-labelledby="compression-slider"
              valueLabelDisplay="auto"
              step={1}
              min={1}
              max={99}
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                onClick={handleCompress}
                disabled={isCompressing}
                fullWidth
              >
                {isCompressing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `${selectedFiles.length}개 파일 압축하기`
                )}
              </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
              {selectedFiles.map((file, index) => (
                <Paper key={index} elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom noWrap>
                    {file.name}
                  </Typography>
                  <ImagePreview src={previewUrls[index]} alt={`Preview ${index}`} />
                  {compressedUrls[index] && (
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      href={compressedUrls[index].url}
                      download={`${file.name.replace(/\.[^/.]+$/, '')}_jelly_image_compress.${file.name.split('.').pop()}`}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      다운로드
                    </Button>
                  )}
                </Paper>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
