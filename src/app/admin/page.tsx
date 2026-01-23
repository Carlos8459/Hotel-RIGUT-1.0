'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();
    useEffect(() => {
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
            <p>Redirigiendo...</p>
        </div>
    );
}
