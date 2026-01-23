"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { authenticate } from "@/lib/actions";

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

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  pin: z.string().min(4, { message: "PIN must be at least 4 characters." }),
});

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPin, setShowPin] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      pin: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setErrorMessage("");
    startTransition(() => {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            formData.append(key, value);
        });

        authenticate(undefined, formData).then((res) => {
            if (res) {
                setErrorMessage(res);
            }
        });
    });
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Enter username" {...field} autoComplete="username" className="h-14 rounded-full px-6 text-base"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem className="relative">
                <FormControl>
                  <Input type={showPin ? "text" : "password"} placeholder="Password" {...field} autoComplete="current-password" className="h-14 rounded-full px-6 pr-12 text-base" />
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
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full h-14 rounded-full bg-button-gradient text-lg font-bold text-primary-foreground shadow-lg" disabled={isPending}>
            {isPending ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
          Recovery Password
        </Link>
      </div>

      <div className="mt-8 text-center text-sm">
        <span className="text-muted-foreground">Not a member? </span>
        <Button asChild variant="outline" className="ml-2 rounded-full border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground">
          <Link href="/register">Register Now</Link>
        </Button>
      </div>
    </div>
  );
}
