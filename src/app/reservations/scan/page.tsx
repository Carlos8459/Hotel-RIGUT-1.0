'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { scanIdCard } from '@/ai/flows/scan-id-card-flow';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, ArrowLeft, LoaderCircle, AlertCircle } from 'lucide-react';
import { IdCardOverlay } from '@/components/ui/id-card-overlay';

export default function ScanIdPage() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('Tu navegador no soporta el acceso a la cámara.');
                setHasCameraPermission(false);
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } // Prefer back camera
                });
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                setError('Permiso de cámara denegado. Por favor, habilita el acceso en tu navegador.');
                setHasCameraPermission(false);
            }
        };
        getCameraPermission();

        return () => {
            // Cleanup: stop video stream when component unmounts
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleScan = async () => {
        if (!videoRef.current || !canvasRef.current || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'El componente de la cámara no está listo.',
            });
            return;
        }

        setIsProcessing(true);
        setError(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const photoDataUri = canvas.toDataURL('image/jpeg', 0.9);

        try {
            const result = await scanIdCard({ photoDataUri });
            if (!result.idNumber || !result.fullName) {
                throw new Error("No se pudo extraer la información. Inténtalo de nuevo.");
            }
            
            const customerId = result.idNumber.replace(/-/g, '');
            const customerDocRef = doc(firestore, 'customers', customerId);

            // Save customer data in the background
            setDocumentNonBlocking(customerDocRef, {
                guestName: result.fullName,
                cedula: result.idNumber,
                idCardImage: photoDataUri,
                createdAt: new Date().toISOString()
            }, { merge: true });

            toast({
                title: '¡Éxito!',
                description: `Datos de ${result.fullName} cargados. Redirigiendo...`,
            });
            
            // Redirect to the new reservation page with pre-filled data
            router.push(`/new-reservation?guestName=${encodeURIComponent(result.fullName)}&cedula=${encodeURIComponent(result.idNumber)}`);

        } catch (err: any) {
            console.error("Scan failed:", err);
            setError(err.message || 'No se pudo procesar la imagen. Asegúrate de que la cédula sea clara y esté bien iluminada.');
            setIsProcessing(false);
        }
    };


    return (
        <div className="dark min-h-screen bg-background text-foreground flex flex-col">
            <header className="flex items-center gap-4 p-4 border-b">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-xl font-bold">Escanear Cédula</h1>
            </header>
            
            <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-4">
                <div className="w-full max-w-lg aspect-[16/10] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <IdCardOverlay />
                    {hasCameraPermission === false && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                            <AlertCircle className="h-10 w-10 mb-4" />
                            <h2 className="text-lg font-semibold">Error de Cámara</h2>
                            <p className="text-sm">{error || "No se pudo acceder a la cámara."}</p>
                        </div>
                    )}
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error de Escaneo</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Button
                    onClick={handleScan}
                    disabled={isProcessing || hasCameraPermission !== true}
                    size="lg"
                    className="w-full max-w-lg"
                >
                    {isProcessing ? (
                        <>
                            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <Camera className="mr-2 h-5 w-5" />
                            Capturar y Analizar
                        </>
                    )}
                </Button>
                
                <canvas ref={canvasRef} className="hidden"></canvas>
            </main>
        </div>
    );
}
