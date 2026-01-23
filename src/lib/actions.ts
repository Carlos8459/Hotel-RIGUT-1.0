'use server';
 
import { z } from 'zod';
import { redirect } from 'next/navigation';
 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const schema = z.object({
        username: z.string(),
        pin: z.string(),
    });

    const parsedData = schema.parse({
        username: formData.get('username'),
        pin: formData.get('pin'),
    });
 
    // Mock authentication
    if (parsedData.username === 'admin' && parsedData.pin === '1234') {
      console.log('Autenticación exitosa');
    } else {
        throw new Error('Usuario o PIN incorrecto.');
    }
  } catch (error) {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Algo salió mal. Por favor, inténtalo de nuevo.';
  }

  redirect('/dashboard');
}
