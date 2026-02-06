'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    username: string | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin123';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState<string | null>(null);

    // Check localStorage on mount
    useEffect(() => {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            setIsAuthenticated(true);
            setUsername(authData.username);
        }
    }, []);

    const login = (inputUsername: string, inputPassword: string): boolean => {
        if (inputUsername === VALID_USERNAME && inputPassword === VALID_PASSWORD) {
            const authData = { username: inputUsername };
            localStorage.setItem('auth', JSON.stringify(authData));
            setIsAuthenticated(true);
            setUsername(inputUsername);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('auth');
        setIsAuthenticated(false);
        setUsername(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
