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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc } from "firebase/firestore";

const formSchema = z.object({
  username: z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(6, { message: "El PIN de acceso debe tener al menos 6 caracteres." }),
  developerPin: z.string(),
}).superRefine((data, ctx) => {
  if (data.developerPin !== \'231005\') {
    ctx.addIssue({
      path: [\'developerPin\'],
      code: \'custom\',
      message: "PIN de desarrollador incorrecto.",
    });
  }
});

export default function RegisterPage() {
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
      email: "",
      password: "",
      developerPin: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage("");
    setIsPending(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      const userProfile = {
        username: values.username,
        email: values.email,
        registrationDate: new Date().toISOString(),
        role: "Admin" as const, // Default role for new users
      };
      
      const userDocRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

      router.push("/dashboard");

    } catch (error: any) {
        if (error.code === \'auth/email-already-in-use\') {
            setErrorMessage(\'Este correo electrónico ya está en uso.\');
        } else if (error.code === \'auth/weak-password\') {
            setErrorMessage(\'El PIN es demasiado débil. Debe tener al menos 6 caracteres.\');
        }
        else {
            setErrorMessage(\'Algo salió mal. Por favor, inténtalo de nuevo.\');
        }
    } finally {
        setIsPending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-login-gradient p-6">
       <div className="z-10 w-full max-w-sm space-y-8">
        <div className="text-center">
            <h1 className="font-headline text-4xl font-bold text-foreground">
                Crear una cuenta
            </h1>
            <p className="mt-2 text-muted-foreground">
                Regístrate para empezar a gestionar el hotel.
            </p>
        </div>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                <FormItem>
                    <FormControl>
                    <Input placeholder="Nombre de usuario" {...field} className="h-14 rounded-full px-6 text-base"/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
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
                    <Input type={showPin ? "text" : "password"} placeholder="PIN de Acceso (6+ caracteres)" {...field} autoComplete="new-password" className="h-14 rounded-full px-6 pr-12 text-base" />
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

            <FormField
                control={form.control}
                name="developerPin"
                render={({ field }) => (
                <FormItem>
                    <FormControl>
                    <Input type="password" placeholder="PIN de Desarrollador" {...field} autoComplete="off" className="h-14 rounded-full px-6 text-base"/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            {errorMessage && (
                <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de registro</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
                </Aler>
            )}

            <Button type="submit" className="w-full h-14 rounded-full bg-button-gradient text-lg font-bold text-primary-foreground shadow-lg" disabled={isPending}>
                {isPending ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
            </form>
        </Form>
        
        <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{\' \'}\
                <Link href="/" className="font-semibold text-primary hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </div>
       </div>
    </div>
  );
}
