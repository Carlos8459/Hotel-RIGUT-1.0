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
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const formSchema = z.object({
  username: z.string().min(1, { message: "Por favor, introduce un nombre de usuario." }),
  password: z.string().min(6, { message: "El PIN debe tener al menos 6 caracteres." }),
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage("");
    setIsPending(true);

    let emailForAuth: string;
    let passwordForAuth: string;
    let isAdminLogin = false;

    if (values.username.toLowerCase() === 'carlos84593326@gmail.com') {
      if (values.password !== '123456') {
        setErrorMessage('PIN incorrecto para el usuario administrador.');
        setIsPending(false);
        return;
      }
      emailForAuth = 'carlos84593326@gmail.com';
      passwordForAuth = '123456';
      isAdminLogin = true;
    } else {
      emailForAuth = values.username;
      passwordForAuth = values.password;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailForAuth, passwordForAuth);
        if (isAdminLogin) {
            const user = userCredential.user;
            // Await these writes to prevent a race condition on the next page
            const adminRoleRef = doc(firestore, "roles_admin", user.uid);
            await setDoc(adminRoleRef, { isAdmin: true }, { merge: true });
            
            const userProfile = {
                username: 'Carlos (Admin)',
                email: emailForAuth,
                registrationDate: new Date().toISOString(),
            };
            const userDocRef = doc(firestore, "users", user.uid);
            await setDoc(userDocRef, userProfile, { merge: true });
        }
        router.push('/dashboard');
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' && isAdminLogin) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, emailForAuth, passwordForAuth);
                const user = userCredential.user;

                // Await these writes to ensure they complete before navigation
                const userProfile = {
                    username: 'Carlos (Admin)',
                    email: emailForAuth,
                    registrationDate: new Date().toISOString(),
                };
                const userDocRef = doc(firestore, "users", user.uid);
                await setDoc(userDocRef, userProfile, { merge: true });

                const adminRoleRef = doc(firestore, "roles_admin", user.uid);
                await setDoc(adminRoleRef, { isAdmin: true }, { merge: true });

                router.push("/dashboard");
            } catch (creationError: any) {
                console.error("Admin user creation error:", creationError);
                setErrorMessage('No se pudo crear el usuario admin. Por favor, inténtalo de nuevo.');
            }
        } else {
            if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
                setErrorMessage('Usuario o PIN incorrecto.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('El formato del usuario es incorrecto. Debe ser un correo electrónico.');
            } else {
                setErrorMessage('Algo salió mal. Por favor, inténtalo de nuevo.');
            }
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Usuario (o correo)" {...field} autoComplete="email" className="h-14 rounded-full px-6 text-base"/>
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
