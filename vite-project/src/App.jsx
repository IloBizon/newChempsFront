import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './Components/Login'
import Registration from './Components/Registration'
import Dashboard from './Components/Dashboard'
import DoctorDashboard from './Components/Doctor/DoctorDashboard';

function App() {
    const navigate = useNavigate()
    const [lastActivity, setLastActivity] = useState(Date.now())


    useEffect(() => {
        const updateActivity = () => setLastActivity(Date.now());
        
        window.addEventListener('mousedown', updateActivity);
        window.addEventListener('keydown', updateActivity);

        const interval = setInterval(() => {
            const now = Date.now();
            const token = localStorage.getItem('token');
            const refresh = localStorage.getItem('refresh');

            if (token && refresh) {
                // 1. ТРЕБОВАНИЕ: Таймер неактивности 1 минута
                if (now - lastActivity > 60000) {
                    localStorage.clear();
                    navigate('/');
                } else {
                    // 2. ТРЕБОВАНИЕ: Рефреш токена (сохраняем твою логику)
                    fetch('http://127.0.0.1:8000/token/refresh/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.access) localStorage.setItem('token', data.access);
                    })
                    .catch(() => {
                        localStorage.clear();
                        navigate('/');
                    });
                }
            }
        }, 45000); // Проверяем чаще, чем лимит (каждые 45 сек)

            return () => {
                window.removeEventListener('mousedown', updateActivity);
                window.removeEventListener('keydown', updateActivity);
                clearInterval(interval);
            };
        }, [lastActivity, navigate]);


    return (
            <Routes>
                <Route path="/" element={<Login />} />
                <Route 
                    path="/dashboard" 
                    element={
                        localStorage.getItem('is_doctor') === 'true' 
                        ? <DoctorDashboard /> 
                        : <Dashboard />
                    } 
                />
                <Route path="/register" element={<Registration />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
    )
}

export default App
