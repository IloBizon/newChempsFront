import React, { useState, useEffect } from 'react';

const Notifications = ({ onBack }) => {
    const [alerts, setAlerts] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const generateAlerts = async () => {
            try {
                const sRes = await fetch('http://127.0.0.1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const stats = await sRes.json();
                const statsArray = Array.isArray(stats) ? stats : stats.results || [];

                const pRes = await fetch('http://127.0.0.1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const prescriptions = await pRes.json();
                const prescrArray = Array.isArray(prescriptions) ? prescriptions : prescriptions.results || [];

                let newAlerts = [];

                // 1. Критические: Проверка давления и глюкозы
                const lastStat = statsArray[statsArray.length - 1];
                if (lastStat) {
                    if (lastStat.systolic_pressure > 140 || lastStat.glucose > 7) {
                        newAlerts.push({
                            id: 1,
                            type: 'critical',
                            title: 'Превышение показателей',
                            text: `Внимание! Давление ${lastStat.systolic_pressure} или глюкоза ${lastStat.glucose} выше нормы.`,
                            date: lastStat.date
                        });
                    }
                }

                // 2. Предупреждения: Пропуск лекарств
                const missed = prescrArray.filter(p => !p.was_taken);
                if (missed.length > 0) {
                    newAlerts.push({
                        id: 2,
                        type: 'warning',
                        title: 'Пропуск приема лекарств',
                        text: `Вы не отметили прием: ${missed.map(m => m.drug?.title).join(', ')}.`,
                        date: new Date().toISOString()
                    });
                }

                // 3. Информационные (Заглушка для конкурса)
                newAlerts.push({
                    id: 3,
                    type: 'info',
                    title: 'Напоминание о визите',
                    text: 'Завтра в 10:00 у вас консультация с терапевтом.',
                    date: new Date().toISOString()
                });

                // 4. Рекомендательные
                newAlerts.push({
                    id: 4,
                    type: 'success',
                    title: 'Совет дня',
                    text: 'Старайтесь выпивать не менее 2-х литров воды в день для поддержания обмена веществ.',
                    date: new Date().toISOString()
                });

                setAlerts(newAlerts);
            } catch (e) {
                console.log("Ошибка загрузки уведомлений");
            }
        };
        generateAlerts();
    }, [token]);

    const getTypeStyle = (type) => {
        switch (type) {
            case 'critical': return { borderLeft: '10px solid red', background: '#fff0f0' };
            case 'warning': return { borderLeft: '10px solid orange', background: '#fff9f0' };
            case 'info': return { borderLeft: '10px solid blue', background: '#f0f4ff' };
            case 'success': return { borderLeft: '10px solid green', background: '#f0fff0' };
            default: return { borderLeft: '10px solid #000' };
        }
    };

    return (
        <div style={s.container}>
            <div style={s.header}>
                <h2>Центр уведомлений ({alerts.length})</h2>
                <button onClick={onBack} style={s.flatBtn}>Назад</button>
            </div>

            <div style={s.list}>
                {alerts.map(a => (
                    <div key={a.id} style={{ ...s.alertCard, ...getTypeStyle(a.type) }}>
                        <div style={s.alertHeader}>
                            <strong>{a.title}</strong>
                            <small>{new Date(a.date).toLocaleDateString()}</small>
                        </div>
                        <p style={s.alertText}>{a.text}</p>
                    </div>
                ))}
            </div>

            <div style={s.settings}>
                <h3>Настройки оповещений</h3>
                <label style={s.label}><input type="checkbox" defaultChecked /> Email-уведомления</label>
                <label style={s.label}><input type="checkbox" /> Push-уведомления</label>
            </div>
        </div>
    );
};

const s = {
    container: { maxWidth: '600px', margin: '0 auto', padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    list: { display: 'flex', flexDirection: 'column', gap: '15px' },
    alertCard: { padding: '15px', border: '1px solid #ddd', borderRadius: '4px' },
    alertHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' },
    alertText: { margin: 0, fontSize: '14px', color: '#333' },
    settings: { marginTop: '40px', borderTop: '2px solid #000', paddingTop: '20px' },
    label: { display: 'block', marginBottom: '10px', fontSize: '14px' },
    flatBtn: { background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }
};

export default Notifications;
