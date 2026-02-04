import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const Analytics = ({ onBack }) => {
    const [stats, setStats] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [period, setPeriod] = useState('week'); // day, week, month

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
            const sRes = await fetch('http://127.0.0.1:8000/health-statistics/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sData = await sRes.json();
            setStats(Array.isArray(sData) ? sData : sData.results || []);

            const pRes = await fetch('http://127.0.0.1:8000/drug-prescription/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pData = await pRes.json();
            setPrescriptions(Array.isArray(pData) ? pData : pData.results || []);
        };
        fetchData();
    }, []);

    const taken = prescriptions.filter(p => p.was_taken).length;
    const missed = prescriptions.length - taken;
    const pieData = [
        { name: 'Принято', value: taken },
        { name: 'Пропущено', value: missed === 0 && taken === 0 ? 1 : missed }
    ];
    const COLORS = ['#000', '#ccc'];

    // 2. Экспорт в CSV
    const exportCSV = () => {
        const headers = "Дата,Глюкоза,Систолическое,Диастолическое,Пульс,Вес\n";
        const rows = stats.map(s => `${s.date},${s.glucose},${s.systolic_pressure},${s.diastolic_pressure},${s.pulse},${s.weight}`).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${new Date().toLocaleDateString()}.csv`;
        a.click();
    };

    return (
        <div style={s.container}>
            <div style={s.header}>
                <h2>Статистика и аналитика</h2>
                <div style={s.row}>
                    <button onClick={exportCSV} style={s.flatBtn}>Экспорт CSV</button>
                    <button onClick={onBack} style={s.flatBtn}>Назад</button>
                </div>
            </div>

            <div style={s.filters}>
                {['day', 'week', 'month', 'quarter'].map(p => (
                    <button key={p} onClick={() => setPeriod(p)} style={period === p ? s.tabActive : s.tab}>
                        {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Квартал'}
                    </button>
                ))}
            </div>

            <div style={s.grid}>
                <div style={s.card}>
                    <h4>Динамика глюкозы (цель: 4.0-7.0)</h4>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="id" hide />
                                <YAxis domain={[0, 20]} />
                                <Tooltip />
                                <Area type="monotone" dataKey="glucose" stroke="#000" fill="#eee" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div style={s.card}>
                    <h4>Артериальное давление (норма: 120/80)</h4>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="id" hide />
                                <YAxis domain={[40, 200]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="systolic_pressure" stroke="#000" dot={false} strokeWidth={2} />
                                <Line type="monotone" dataKey="diastolic_pressure" stroke="#888" dot={false} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={s.card}>
                    <h4>Приверженность лечению</h4>
                    <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                        <PieChart width={200} height={200}>
                            <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '12px' }}>Исполнено: {taken} / Всего: {prescriptions.length}</p>
                </div>

                <div style={s.card}>
                    <h4>Эффективность терапии</h4>
                    <p style={s.text}>Стабильность: {stats.length > 5 ? 'Высокая' : 'Недостаточно данных'}</p>
                    <p style={s.text}>Тренд: {stats.length > 1 && stats[stats.length - 1].glucose > 7 ? 'Рост глюкозы ⚠️' : 'Показатели в норме'}</p>
                    <p style={s.text}>Рекомендация: Продолжайте текущий курс и увеличьте прогулки.</p>
                </div>
            </div>
        </div>
    );
};

const s = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    row: { display: 'flex', gap: '15px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    card: { border: '1px solid #000', padding: '15px', background: '#fff' },
    filters: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tab: { padding: '8px 15px', border: '1px solid #000', background: '#fff', cursor: 'pointer' },
    tabActive: { padding: '8px 15px', border: '1px solid #000', background: '#000', color: '#fff' },
    flatBtn: { background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' },
    text: { fontSize: '14px', margin: '5px 0' }
};

export default Analytics;