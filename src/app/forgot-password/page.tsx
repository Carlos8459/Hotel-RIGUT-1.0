"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
});


export default function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      await sendPasswordResetEmail(auth, values.email);
      setSuccessMessage("Se ha enviado un correo de recuperación a tu dirección. Revisa tu bandeja de entrada.");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        setErrorMessage("No se encontró ninguna cuenta con ese correo electrónico.");
      } else {
        setErrorMessage("Algo salió mal. Por favor, inténtalo de nuevo.");
      }
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
                    Ingresa tu correo electrónico para recibir un enlace de recuperación.
                </p>
            </div>

            {successMessage ? (
              <Alert variant="default" className="text-left border-green-500/50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-500">Correo Enviado</AlertTitle>
                  <AlertDescription>
                      {successMessage}
                  </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-left">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input placeholder="tu@correo.com" {...field} />
                        </FormControl>
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
                    {isPending ? "Enviando..." : "Enviar correo de recuperación"}
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