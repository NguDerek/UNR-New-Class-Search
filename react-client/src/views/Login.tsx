import { z } from 'zod';
import { useState } from 'react';

//For Form Validation
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});