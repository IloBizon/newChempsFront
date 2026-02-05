import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientList from './PatientList';
import PatientCard from './PatiendCard';
import DoctorAnalytics from './DoctorAnalytics';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Дашборд');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const docData = JSON.parse(localStorage.getItem('user_data') || '{}');

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://127.0.0.1:8000/users/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setPatients(Array.isArray(data) ? data : data.results || []);
            } catch (e) {
                console.error("Ошибка загрузки данных");
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const stats = {
        critical: patients.filter(p => {
            const history = p.healthstatistics_set;
            const last = history && history.length > 0 ? history[history.length - 1] : null;
            return last && (last.systolic_pressure > 140 || last.glucose > 7);
        }).length,
        active: patients.length,
        prescriptions: patients.reduce((acc, p) => acc + (p.drugprescription_set?.filter(d => !d.was_taken).length || 0), 0)
    };

    return (
        <div style={s.page}>
            <header style={s.header}>
                <div style={s.logo}>MED-OS 2000 <span style={s.tag}>ZOV EDITION</span></div>
                <div style={s.docInfo}>
                    <b>{docData.username}</b> 
                    <span style={s.dept}>| Кардиологическое отделение</span>
                </div>
                <div style={s.actions}>
                    <span style={s.icon}>Уведомления {stats.critical > 0 && <span style={s.badge}>{stats.critical}</span>}</span>
                    <button onClick={() => { localStorage.clear(); navigate('/'); }} style={s.exitBtn}>Выход</button>
                </div>
            </header>

            <div style={s.body}>
                <aside style={s.sidebar}>
                    {['Дашборд', 'Пациенты', 'Назначения', 'Расписание', 'Аналитика', 'Отчеты'].map(item => (
                        <button key={item} 
                                onClick={() => setActiveTab(item)}
                                style={activeTab === item ? s.menuBtnActive : s.menuBtn}>
                            {item}
                        </button>
                    ))}
                </aside>

                <main style={s.content}>
                    {activeTab === 'Дашборд' && (
                        <div style={s.grid}>
                            <div style={s.card}>
                                <h3 style={s.cardTitle}>СРОЧНЫЕ ДЕЙСТВИЯ</h3>
                                <div style={s.statRow}>
                                    <span style={s.statLabel}>Критические показатели:</span>
                                    <span style={s.statValRed}>{stats.critical}</span>
                                </div>
                                <div style={s.statRow}>
                                    <span style={s.statLabel}>Незавершенные назначения:</span>
                                    <span style={s.statVal}>{stats.prescriptions}</span>
                                </div>
                                <div style={s.statRow}>
                                    <span style={s.statLabel}>Плановые визиты:</span>
                                    <span style={s.statVal}>4</span>
                                </div>
                            </div>

                            <div style={s.card}>
                                <h3 style={s.cardTitle}>МОИ ПАЦИЕНТЫ</h3>
                                <div style={s.statRow}>
                                    <span style={s.statLabel}>Всего пациентов:</span>
                                    <span style={s.statVal}>{stats.active}</span>
                                </div>
                                <div style={s.statRow}>
                                    <span style={s.statLabel}>Новые записи:</span>
                                    <span style={s.statVal}>2</span>
                                </div>
                                <button style={s.btnInCard} onClick={() => setActiveTab('Пациенты')}>Перейти к списку</button>
                            </div>

                            <div style={{...s.card, gridColumn: 'span 2'}}>
                                <h3 style={s.cardTitle}>МЕДИЦИНСКИЕ ОПОВЕЩЕНИЯ</h3>
                                <div style={s.alertList}>
                                    {patients.filter(p => {
                                        const history = p.healthstatistics_set;
                                        const last = history && history.length > 0 ? history[history.length - 1] : null;
                                        return last && (last.systolic_pressure > 140);
                                    }).map(p => (
                                        <div key={p.id} style={s.alertItem}>
                                            <span><b>{p.email}</b>: Фиксация давления {p.healthstatistics_set[p.healthstatistics_set.length-1].systolic_pressure} мм рт. ст.</span>
                                            <button style={s.btnMini}>Открыть карту</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Пациенты' && (
                        selectedPatientId 
                        ? <PatientCard 
                            patientId={selectedPatientId} 
                            onBack={() => setSelectedPatientId(null)} 
                        />
                        : <PatientList 
                            onSelectPatient={(id) => {
                                setSelectedPatientId(id);
                            }} 
                        />
                    )}
                    {activeTab === 'Аналитика' && <DoctorAnalytics />}
                </main>
            </div>
        </div>
    );
};

const s = {
    page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff', fontFamily: 'monospace' },
    header: { display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '2px solid #000', alignItems: 'center' },
    logo: { fontWeight: 'bold', fontSize: '20px', letterSpacing: '2px' },
    tag: { fontSize: '10px', background: '#000', color: '#fff', padding: '2px 5px', verticalAlign: 'middle' },
    docInfo: { fontSize: '14px' },
    dept: { color: '#666', marginLeft: '10px' },
    actions: { display: 'flex', gap: '20px', alignItems: 'center' },
    badge: { background: 'red', color: '#fff', padding: '2px 6px', fontSize: '10px', borderRadius: '10px' },
    exitBtn: { border: '1px solid #000', background: '#fff', cursor: 'pointer', padding: '5px 10px', fontSize: '12px' },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },
    sidebar: { width: '200px', borderRight: '2px solid #000', display: 'flex', flexDirection: 'column', padding: '10px', gap: '5px' },
    menuBtn: { textAlign: 'left', padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' },
    menuBtnActive: { textAlign: 'left', padding: '12px', border: 'none', background: '#000', color: '#fff', cursor: 'pointer' },
    content: { flex: 1, padding: '20px', overflowY: 'auto', background: '#f9f9f9' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    card: { border: '2px solid #000', background: '#fff', padding: '15px' },
    cardTitle: { margin: '0 0 15px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px', fontWeight: 'bold' },
    statRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' },
    statVal: { fontWeight: 'bold' },
    statValRed: { fontWeight: 'bold', color: 'red' },
    btnInCard: { width: '100%', marginTop: '10px', padding: '10px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' },
    alertList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    alertItem: { padding: '10px', background: '#fff0f0', borderLeft: '5px solid red', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnMini: { padding: '5px 10px', background: '#000', color: '#fff', border: 'none', fontSize: '10px', cursor: 'pointer' }
};

export default DoctorDashboard;
