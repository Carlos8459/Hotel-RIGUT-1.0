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
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc } from "firebase/firestore";

const formSchema = z.object({
  username: z.string().min(1, { message: "Por favor, introduce un nombre de usuario." }),
  password: z.string().min(4, { message: "El PIN debe tener al menos 4 caracteres." }),
});

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [isPending, setIsPending] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setErrorMessage("");
    setIsPending(true);

    let emailForAuth: string;
    let passwordForAuth: string;

    if (values.username === 'admin') {
      if (values.password !== '1234') {
        setErrorMessage('PIN incorrecto para el usuario admin.');
        setIsPending(false);
        return;
      }
      // Using a new email to avoid conflicts with previously created (and possibly broken) admin users.
      emailForAuth = 'admin-login-final@hotel-rigut.app';
      passwordForAuth = '123456';
    } else {
      emailForAuth = values.username;
      passwordForAuth = values.password;
    }
    
    signInWithEmailAndPassword(auth, emailForAuth, passwordForAuth)
      .then(() => {
        router.push('/dashboard');
      })
      .catch((error) => {
        if (error.code === 'auth/user-not-found' && values.username === 'admin') {
          // Admin user doesn't exist, so create it and then log in.
          createUserWithEmailAndPassword(auth, emailForAuth, passwordForAuth)
            .then((userCredential) => {
                const user = userCredential.user;
                const userProfile = {
                    username: 'admin',
                    email: emailForAuth,
                    registrationDate: new Date().toISOString(),
                };
                const userDocRef = doc(firestore, "users", user.uid);
                setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

                const adminRoleRef = doc(firestore, "roles_admin", user.uid);
                setDocumentNonBlocking(adminRoleRef, { isAdmin: true }, { merge: true });

                router.push("/dashboard");
            })
            .catch(creationError => {
                console.error("Admin user creation error:", creationError);
                setErrorMessage('No se pudo crear el usuario admin. Por favor, inténtalo de nuevo.');
            })
            .finally(() => {
                setIsPending(false);
            });
        } else {
            if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
                setErrorMessage('Usuario o PIN incorrecto.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('El formato del usuario es incorrecto. Debe ser un correo electrónico o "admin".');
            } else {
                setErrorMessage('Algo salió mal. Por favor, inténtalo de nuevo.');
            }
            setIsPending(false);
        }
      });
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Usuario" {...field} autoComplete="username" className="h-14 rounded-full px-6 text-base"/>
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
