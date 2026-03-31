import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Terminal from './components/Terminal';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import BotDetails from './components/BotDetails';
import { ThemeProvider } from './store/ThemeContext';

class RootErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    render() {
        if (this.state.error) {
            return (
                <div style={{
                    padding: '32px', background: '#131722', color: '#d1d4dc',
                    height: '100vh', fontFamily: 'monospace', overflow: 'auto'
                }}>
                    <h1 style={{ color: '#ef5350', marginBottom: '16px' }}>Runtime Error</h1>
                    <pre style={{ color: '#ff9800', whiteSpace: 'pre-wrap' }}>
                        {this.state.error.toString()}
                    </pre>
                    <pre style={{ color: '#787b86', whiteSpace: 'pre-wrap', marginTop: '12px', fontSize: '11px' }}>
                        {this.state.error.stack}
                    </pre>
                    <button
                        onClick={() => this.setState({ error: null })}
                        style={{ marginTop: '16px', padding: '8px 16px', background: '#2962ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    return (
        <RootErrorBoundary>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/terminal" element={<Terminal />} />
                        <Route path="/user/dashboard" element={<Dashboard />} />
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/dashboard/bot/:id" element={<BotDetails />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </RootErrorBoundary>
    );
}

export default App;
