import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ASIS title', () => {
  render(<App />);
  expect(screen.getByText(/ASIS — Autonomous Structural Intelligence/i)).toBeInTheDocument();
});
