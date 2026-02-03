'''"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, useFirestore } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Eye } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres." }),
  developerPin: z.string(), // Eliminamos la restricción de Zod aquí
});


export default function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      developerPin: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    // Verificación manual del PIN de desarrollador
    if (values.developerPin !== '231005') {
      setErrorMessage("PIN de desarrollador incorrecto.");
      setIsPending(false);
      return;
    }

    try {
      // Find user by username
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("username", "==", values.username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
          setErrorMessage("No se encontró ninguna cuenta con ese nombre de usuario.");
          setIsPending(false);
          return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userEmail = userDoc.data().email;

      if (!userEmail) {
          setErrorMessage("La cuenta de usuario no tiene un correo electrónico asociado. Contacta al administrador.");
          setIsPending(false);
          return;
      }
      
      await sendPasswordResetEmail(auth, userEmail);
      setSuccessMessage("Se ha enviado un correo de recuperación a la dirección asociada con el usuario. El usuario debe revisar su bandeja de entrada.");
    } catch (error: any) {
      console.error(error);
      setErrorMessage("Algo salió mal. Por favor, inténtalo de nuevo.");
    } finally {
      setIsPending(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="z-10 w-full max-w-sm space-y-8">
            <div className="text-center">
                <h1 className="font-headline text-4xl font-bold text-foreground">
                    Recuperar PIN
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Ingresa el nombre del usuario y el PIN de desarrollador para iniciar la recuperación.
                </p>
            </div>

            {successMessage ? (
              <Alert variant="default" className="text-left border-green-500/50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-500">Correo Enviado</AlertTitle>
                  <AlertDescription>
                      {successMessage}
                  </AlerDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-left">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Usuario</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Juan Perez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="developerPin"
                    render={({ field }) => (
                    <FormItem className="relative">
                        <FormLabel>PIN de Desarrollador</FormLabel>
                        <FormControl>
                          <Input type={showPin ? "text" : "password"} placeholder="PIN de seguridad" {...field} />
                        </FormControl>
                         <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute bottom-2 right-0 flex items-center pr-3 text-gray-400"
                            >
                            <Eye className="h-5 w-5" />
                        </button>
                        <FormMessage />
                    </FormItem>
                    )}
                  />

                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Verificando..." : "Enviar correo de recuperación"}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 text-center">
                <Button asChild variant="link">
                    <Link href="/">
                        Volver a inicio de sesión
                    </Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
'''