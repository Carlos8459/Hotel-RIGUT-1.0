'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';


import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft, LoaderCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { QrCodeOverlay } from '@/components/ui/qr-code-overlay';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ScanIdPage() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(true);

    // Camera Permission Effect
    useEffect(() => {
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setScanError('Tu navegador no soporta el acceso a la cámara.');
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
                setScanError('Permiso de cámara denegado. Por favor, habilita el acceso en tu navegador.');
                setHasCameraPermission(false);
            }
        };
        getCameraPermission();

        return () => {
            // Cleanup: stop video stream and animation frame
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    // QR Scanning Effect
    useEffect(() => {
        if (hasCameraPermission && isScanning && videoRef.current) {
            const video = videoRef.current;
            const scan = () => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    const context = canvas.getContext('2d');
                    if (!context) return;
                    
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (code) {
                        handleScanResult(code.data);
                        return; // Stop scanning
                    }
                }
                animationFrameId.current = requestAnimationFrame(scan);
            };
            animationFrameId.current = requestAnimationFrame(scan);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
    }, [hasCameraPermission, isScanning]);


    const handleScanResult = (data: string) => {
        setIsScanning(false);
        try {
            // The data format from the QR code is assumed to be: "CEDULA<NOMBRE COMPLETO"
            const parts = data.split('<');
            const cedula = parts[0]?.trim();
            const guestName = parts.slice(1).join(' ').trim();
    
            if (!cedula || !guestName) {
                 throw new Error("No se pudo extraer nombre y cédula del código. Asegúrese de que el código esté bien enfocado.");
            }
            
            // Save customer profile non-blockingly
            if (firestore) {
                const customerId = cedula.replace(/-/g, '');
                const customerDocRef = doc(firestore, 'customers', customerId);

                setDocumentNonBlocking(customerDocRef, {
                    guestName: guestName,
                    cedula: cedula,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            }
    
            toast({
                title: '¡Cédula Escaneada!',
                description: 'Redirigiendo al formulario de check-in...',
            });
    
            // Stop the camera
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
    
            router.push(`/new-reservation?guestName=${encodeURIComponent(guestName)}&cedula=${encodeURIComponent(cedula)}`);
    
        } catch (error: any) {
            console.error("Error parsing QR code:", error);
            setScanError(error.message || 'El código QR no tiene el formato esperado. Inténtalo de nuevo.');
        }
    };

    const restartScan = () => {
        setScanError(null);
        setIsScanning(true);
    };

    return (
        <div className="dark min-h-screen bg-background text-foreground flex flex-col pt-12">
            <header className="flex items-center gap-4 p-4 border-b">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-xl font-bold">Escanear Cédula</h1>
            </header>
            
            <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-4">
                <div className="w-full max-w-lg aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {isScanning && <QrCodeOverlay />}
                    
                    {hasCameraPermission === null && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                            <LoaderCircle className="h-10 w-10 mb-4 animate-spin" />
                            <p>Solicitando acceso a la cámara...</p>
                        </div>
                    )}

                    {hasCameraPermission === false && scanError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                             <Alert variant="destructive" className="border-0 bg-transparent text-white">
                                <AlertCircle className="h-5 w-5" />
                                <AlertTitle className="text-lg font-semibold">Error de Cámara</AlertTitle>
                                <AlertDescription>
                                    {scanError}
                                </AlertDescription>
                             </Alert>
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden"></canvas>
                
                {!isScanning && scanError && (
                    <Alert variant="destructive" className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error de Escaneo</AlertTitle>
                        <AlertDescription>{scanError}</AlertDescription>
                        <Button onClick={restartScan} variant="link" className="p-0 h-auto mt-2 text-destructive">
                            <RefreshCw className="mr-2 h-4 w-4"/>
                            Escanear de nuevo
                        </Button>
                    </Alert>
                )}

                {!scanError && (
                    <p className="text-muted-foreground text-center max-w-md">
                        {isScanning ? 'Apunta la cámara al código QR de la cédula.' : 'Procesando...'}
                    </p>
                )}

            </main>
        </div>
    );
}
