import { Navigate, Route, Routes } from 'react-router-dom';
import { FormPage } from './FormPage';
import { MapperPage } from './MapperPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />
      <Route path="/mapper" element={<MapperPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
