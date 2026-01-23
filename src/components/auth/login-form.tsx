"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Eye } from "lucide-react";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(6, { message: "El PIN debe tener al menos 6 caracteres." }),
});

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [isPending, setIsPending] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const auth = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage("");
    setIsPending(true);
    
    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        router.push('/dashboard');
    } catch (error: any) {
        if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
            setErrorMessage('Correo o PIN incorrecto.');
        } else if (error.code === 'auth/invalid-email') {
            setErrorMessage('El formato del correo electrónico es incorrecto.');
        } else {
            console.error("Authentication error:", error);
            setErrorMessage('Algo salió mal. Por favor, inténtalo de nuevo.');
        }
    } finally {
        setIsPending(false);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Correo electrónico" {...field} autoComplete="email" className="h-14 rounded-full px-6 text-base"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="relative">
                <FormControl>
                  <Input type={showPin ? "text" : "password"} placeholder="PIN" {...field} autoComplete="current-password" className="h-14 rounded-full px-6 pr-12 text-base" />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400"
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
              <AlertTitle>Error de autenticación</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full h-14 rounded-full bg-button-gradient text-lg font-bold text-primary-foreground shadow-lg" disabled={isPending}>
            {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/forgot-password" className="hover:underline">
            ¿Olvidaste tu PIN?
          </Link>
          {' | '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Crear una cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
