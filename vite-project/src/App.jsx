import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './Components/Login'
import Registration from './Components/Registration'

function App() {
    const navigate = useNavigate()
    const [lastActivity, setLastActivity] = useState(Date.now())

    useEffect(() => {
        const updateActivity = () => setLastActivity(Date.now())
        
        window.addEventListener('mousedown', updateActivity)
        window.addEventListener('keydown', updateActivity)
        window.addEventListener('scroll', updateActivity)

        const interval = setInterval(() => {
            const now = Date.now()
            const token = localStorage.getItem('token')
            const refresh = localStorage.getItem('refresh')

            if (token && refresh) {
                if (now - lastActivity > 120000) {
                    localStorage.clear()
                    navigate('/')
                } else {
                    fetch('http://127.0.0.1', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.access) {
                            localStorage.setItem('token', data.access)
                        }
                    })
                    .catch(() => {
                        localStorage.clear()
                        navigate('/')
                    })
                }
            }
        }, 90000)

        return () => {
            window.removeEventListener('mousedown', updateActivity)
            window.removeEventListener('keydown', updateActivity)
            window.removeEventListener('scroll', updateActivity)
            clearInterval(interval)
        }
    }, [lastActivity, navigate])

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}

export default App
