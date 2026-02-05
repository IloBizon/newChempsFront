import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const DoctorAnalytics = () => {
    const [data, setData] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetch('http://127.0.0.1:8000/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(d => setData(Array.isArray(d) ? d : d.results || []));
    }, [token]);

    const getRiskData = () => {
        let critical = 0, warning = 0, stable = 0;
        data.forEach(p => {
            const last = p.healthstatistics_set?.[p.healthstatistics_set.length - 1];
            if (last && (last.systolic_pressure > 160 || last.glucose > 10)) critical++;
            else if (last && (last.systolic_pressure > 140 || last.glucose > 7)) warning++;
            else stable++;
        });
        return [
            { name: 'Высокий риск', value: critical, color: '#ff0000' },
            { name: 'Средний риск', value: warning, color: '#ffa500' },
            { name: 'Стабильные', value: stable, color: '#000000' }
        ];
    };

    const getEfficiencyData = () => {
        return data.slice(0, 5).map(p => ({
            name: p.email.split('@')[0],
            taken: p.drugprescription_set?.filter(d => d.was_taken).length || 0,
            missed: p.drugprescription_set?.filter(d => !d.was_taken).length || 0
        }));
    };

    const riskData = getRiskData();
    const effData = getEfficiencyData();

    return (
        <div style={s.container}>
            <h2 style={s.title}>АНАЛИТИЧЕСКИЙ ЦЕНТР</h2>

            <div style={s.grid}>
                <div style={s.card}>
                    <h4>Прогнозирование рисков осложнений</h4>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {riskData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={s.card}>
                    <h4>Эффективность терапии (Приверженность)</h4>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={effData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="taken" fill="#000" name="Принято" />
                                <Bar dataKey="missed" fill="#ccc" name="Пропущено" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div style={{ ...s.card, gridColumn: 'span 2' }}>
                    <h4>Динамика выявления негативных тенденций (Среднее АД по базе)</h4>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer>
                            <LineChart data={effData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="taken" stroke="#000" strokeWidth={3} name="Тенденция выздоровления" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={s.footer}>
                <button onClick={() => alert('Генерация отчета "Клинические результаты"...')} style={s.btn}>СГЕНЕРИРОВАТЬ МЕДИЦИНСКИЙ ОТЧЕТ</button>
            </div>
        </div>
    );
};

const s = {
    container: { display: 'flex', flexDirection: 'column', gap: '20px' },
    title: { fontSize: '18px', borderBottom: '2px solid #000', paddingBottom: '10px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    card: { border: '1px solid #000', padding: '15px', background: '#fff' },
    footer: { marginTop: '20px', textAlign: 'right' },
    btn: { background: '#000', color: '#fff', border: 'none', padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }
};

export default DoctorAnalytics;
