import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Diary from './Diary';
import Analytics from './Analytics';
import Notifications from './Notifications';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('Главная');
    const [stats, setStats] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [error, setError] = useState('');
    const [alertsCount, setAlertsCount] = useState(0);

    const [newRecord, setNewRecord] = useState({
        glucose: 5.5, sys: 120, dia: 80, pulse: 70, weight: 70.0, text: ''
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) window.location.href = '/';

        const fetchData = async () => {
            try {
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

                let count = 0;
                const last = statsArray[statsArray.length - 1];
                if (last && (last.systolic_pressure > 140 || last.glucose > 7)) count++;
                count += prescrArray.filter(p => !p.was_taken).length;
            
                setAlertsCount(count + 2);
            } catch (e) {
                console.log("Ошибка загрузки данных");
            }
        };
        fetchData();
    }, [token]);

    const handleAddStats = async () => {
        try {
            const token = localStorage.getItem('token');

            const dataToSend = {
                glucose: Math.round(parseFloat(newRecord.glucose)),
                systolic_pressure: parseInt(newRecord.sys),
                diastolic_pressure: parseInt(newRecord.dia),
                pulse: parseInt(newRecord.pulse),
                weight: parseInt(newRecord.weight),
                text: newRecord.text || "Замер показателей"
            };

            const res = await fetch('http://127.0.0.1:8000/health-statistics/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (res.ok) {
                alert("Данные успешно сохранены");
                window.location.reload();
            } else {
                const errorData = await res.json();
                alert("Ошибка валидации: " + JSON.stringify(errorData));
            }
        } catch (e) {
            alert("Ошибка сети или сервера");
        }
    };

    const handleMarkTaken = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:8000/drug-prescription/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ was_taken: true })
            });

            if (res.ok) {
                alert("Препарат отмечен как принятый");
                setPrescriptions(prescriptions.map(p =>
                    p.id === id ? { ...p, was_taken: true } : p
                ));
            } else {
                const data = await res.json();
                alert("Ошибка: " + JSON.stringify(data));
            }
        } catch (e) {
            alert("Ошибка связи с сервером");
        }
    };

    const latest = stats[0] || {};
    const adherence = prescriptions.length > 0
        ? Math.round((prescriptions.filter(p => p.was_taken).length / prescriptions.length) * 100)
        : 0;

    return (
        <div style={s.page}>
            <header style={s.header}>
                <div style={s.logo}>ЦДП</div>
                <div style={s.userNav}>
                    <span>Иванов И.И.</span>
                    <span style={s.icon} onClick={() => setActiveTab('Уведомления')}>
                        🔔 {alertsCount > 0 && <span style={s.badge}>{alertsCount}</span>}
                    </span>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={s.flatBtn}>Выход</button>
                </div>
            </header>

            <div style={s.body}>
                <aside style={s.sidebar}>
                    {['Главная', 'Мои показатели', 'Назначения', 'Дневник', 'Статистика','Настройки', 'Помощь'].map(item => (
                        <button key={item}
                            onClick={() => setActiveTab(item)}
                            style={activeTab === item ? s.menuBtnActive : s.menuBtn}>
                            {item}
                        </button>
                    ))}
                </aside>

                <main style={s.content}>
                    {activeTab === 'Главная' && (
                        <div style={s.container}>
                            <h1>Добрый день!</h1>
                            <div style={s.dashboardGrid}>
                                <div style={s.card}>
                                    <h3>Последние показатели</h3>
                                    <p>Глюкоза: {latest.glucose || '--'} ммоль/л</p>
                                    <p>Давление: {latest.systolic_pressure || '--'}/{latest.diastolic_pressure || '--'}</p>
                                </div>
                                <div style={s.card}>
                                    <h3>Назначения</h3>
                                    <p>Активно: {prescriptions.filter(p => !p.was_taken).length} преп.</p>
                                    <p>Приверженность: {adherence}%</p>
                                </div>
                                <div style={s.card}>
                                    <h3>Визиты</h3>
                                    <p>На этой неделе: 1</p>
                                </div>
                            </div>
                            <div style={s.actions}>
                                <button onClick={() => setActiveTab('Мои показатели')} style={s.bigBtn}>Добавить показатели</button>
                                <button onClick={() => setActiveTab('Назначения')} style={s.bigBtn}>Прием лекарства</button>
                                <button style={s.bigBtn}>Записать симптомы</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Мои показатели' && (
                        <div style={s.container}>
                            <h2>Мои показатели</h2>
                            <div style={s.card}>
                                <label>Глюкоза (ммоль/л): {newRecord.glucose}</label>
                                <input type="range" min="2" max="20" step="0.1"
                                    value={newRecord.glucose}
                                    onChange={e => setNewRecord({ ...newRecord, glucose: e.target.value })}
                                    style={s.range} />

                                <input type="number" placeholder="Систолическое (60-250)" style={s.input}
                                    onChange={e => setNewRecord({ ...newRecord, sys: e.target.value })} />

                                <input type="number" placeholder="Диастолическое (40-150)" style={s.input}
                                    onChange={e => setNewRecord({ ...newRecord, dia: e.target.value })} />

                                <input type="number" placeholder="Пульс (40-180)" style={s.input}
                                    onChange={e => setNewRecord({ ...newRecord, pulse: e.target.value })} />

                                <input type="number" step="0.1" placeholder="Вес (кг)" style={s.input}
                                    onChange={e => setNewRecord({ ...newRecord, weight: e.target.value })} />

                                <button onClick={handleAddStats} style={s.btnBlack}>Сохранить</button>
                            </div>

                            <div style={s.chartBox}>
                                <h3>Динамика давления</h3>
                                <div style={{ width: '100%', height: 250 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={stats}>
                                            <CartesianGrid stroke="#ccc" />
                                            <XAxis dataKey="id" hide />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="systolic_pressure" stroke="#000" dot={true} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Назначения' && (
                        <div style={s.container}>
                            <h2>Назначения</h2>
                            <p>Приверженность лечению: {adherence}%</p>
                            {prescriptions.map(p => (
                                <div key={p.id} style={s.listItem}>
                                    <div>
                                        <strong>{p.drug?.title || 'Препарат'}</strong> - {p.drug?.dose || 0} мг
                                        <p style={{ fontSize: '12px', margin: 0 }}>{p.was_taken ? 'Принято' : 'Ожидает приема'}</p>
                                    </div>
                                    {!p.was_taken && <button style={s.btnBlackSmall} onClick={() => handleMarkTaken(p.id)} >Принять</button>}
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'Уведомления' && (
                        <Notifications onBack={() => setActiveTab('Главная')} />
                    )}
                    {activeTab === 'Дневник' && (
                        <Diary onBack={() => setActiveTab('Главная')} />
                    )}
                    {activeTab === 'Статистика' && (
                        <Analytics onBack={() => setActiveTab('Главная')} />
                    )}
                </main>
            </div>
        </div>
    );
};

const s = {
    page: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#fff', fontFamily: 'sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #000', alignItems: 'center' },
    logo: { fontWeight: 'bold', fontSize: '18px' },
    userNav: { display: 'flex', gap: '15px', alignItems: 'center' },
    icon: { cursor: 'pointer' },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },
    sidebar: { width: '200px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', padding: '10px' },
    menuBtn: { textAlign: 'left', padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' },
    menuBtnActive: { textAlign: 'left', padding: '10px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px' },
    content: { flex: 1, padding: '20px', overflowY: 'auto' },
    container: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' },
    dashboardGrid: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
    card: { flex: '1 1 200px', border: '1px solid #000', padding: '15px' },
    actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    bigBtn: { flex: 1, padding: '20px', background: '#fff', border: '1px solid #000', cursor: 'pointer', fontSize: '14px' },
    input: { padding: '10px', border: '1px solid #000', outline: 'none' },
    range: { width: '100%', margin: '10px 0' },
    btnBlack: { padding: '12px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' },
    btnBlackSmall: { padding: '5px 10px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' },
    chartBox: { border: '1px solid #000', padding: '15px', marginTop: '20px' },
    listItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center' },
    flatBtn: { background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }
};

export default Dashboard;
