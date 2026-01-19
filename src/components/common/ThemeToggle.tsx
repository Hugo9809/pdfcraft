'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button'; // Assuming Button component exists
import { Moon, Sun } from 'lucide-react'; // Icons for the toggle, or we can use generic circle icons

export const ThemeToggle = () => {
    const [theme, setTheme] = useState<'blue' | 'pink'>('blue');

    useEffect(() => {
        // Load saved theme on mount
        const savedTheme = localStorage.getItem('theme-preference') as 'blue' | 'pink';
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
    }, []);

    const applyTheme = (newTheme: 'blue' | 'pink') => {
        const root = document.documentElement;
        if (newTheme === 'pink') {
            root.style.setProperty('--color-primary', '330 100% 71%'); // Pink
            root.style.setProperty('--color-ring', '330 100% 71%');
            // Adjust hover state for pink if needed, maybe slightly darker pink
            root.style.setProperty('--color-primary-hover', '330 100% 61%');
        } else {
            root.style.setProperty('--color-primary', '231 100% 27%'); // Dark Blue
            root.style.setProperty('--color-ring', '231 100% 27%');
            root.style.setProperty('--color-primary-hover', '231 100% 17%');
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'blue' ? 'pink' : 'blue';
        setTheme(newTheme);
        localStorage.setItem('theme-preference', newTheme);
        applyTheme(newTheme);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={`relative w-8 h-8 rounded-full overflow-hidden transition-all duration-300 border border-[hsl(var(--color-border))] hover:scale-105 active:scale-95 ${theme === 'pink' ? 'bg-pink-100 dark:bg-pink-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}
            aria-label={`Switch to ${theme === 'blue' ? 'Pink' : 'Blue'} theme`}
            title={`Switch to ${theme === 'blue' ? 'Pink' : 'Blue'} theme`}
        >
            <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${theme === 'blue' ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="w-4 h-4 rounded-full bg-[hsl(231,100%,27%)]" />
            </div>
            <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${theme === 'pink' ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="w-4 h-4 rounded-full bg-[hsl(330,100%,71%)]" />
            </div>
        </Button>
    );
};
