"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
});

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsPending(true);
    try {
      // This is a non-blocking call in the sense that we aren't writing to Firestore,
      // but we await it to provide user feedback.
      await sendPasswordResetEmail(auth, values.email);
      setSuccessMessage("Si existe una cuenta con ese correo, se ha enviado un enlace para restablecer tu PIN. Revisa tu bandeja de entrada.");
      form.reset();
    } catch (error: any) {
      console.error("Password reset error:", error);
      if (error.code === 'auth/invalid-email') {
        setErrorMessage("El correo electrónico no es válido.");
      } else {
        setErrorMessage("No se pudo enviar el correo de restablecimiento. Por favor, inténtalo de nuevo más tarde.");
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
                    Introduce tu correo electrónico y te enviaremos un enlace para que puedas volver a acceder a tu cuenta.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Correo electrónico</FormLabel>
                        <FormControl>
                            <Input placeholder="tu@correo.com" {...field} className="h-12 px-4 text-base"/>
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
                    {successMessage && (
                        <Alert variant="default" className="border-green-500/50 text-green-900 dark:text-green-200 [&>svg]:text-green-600 dark:[&>svg]:text-green-400">
                           <AlertCircle className="h-4 w-4" />
                           <AlertTitle>¡Correo enviado!</AlertTitle>
                           <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" className="w-full h-12" disabled={isPending}>
                        {isPending ? "Enviando..." : "Enviar correo"}
                    </Button>
                </form>
            </Form>

            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    ¿Recordaste tu PIN?{' '}
                    <Link href="/" className="font-semibold text-primary hover:underline">
                        Volver a inicio de sesión
                    </Link>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
