import React, { useEffect } from 'react';
import Registration from './Components/Registration';

function App() {
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            console.log("Пользователь авторизован");
        }
    }, []);

    return (
        <Registration />
    );
}
export default App