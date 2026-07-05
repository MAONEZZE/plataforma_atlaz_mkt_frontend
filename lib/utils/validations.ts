import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";

export const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const columnSchema = z.object({
  name: z.string().min(1, "Nome obrigatório."),
});

export type ColumnFormInput = z.infer<typeof columnSchema>;

export const cellValueSchema = z.number().int().min(0, "Não pode ser negativo.");

export const cadastroClienteSchema = z.object({
  name: z.string().min(1, "Nome obrigatório."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres."),
  phone: z
    .string()
    .min(1, "Telefone obrigatório.")
    .refine((v) => isValidPhoneNumber(v), "Telefone inválido."),
  description: z.string().optional(),
});

export type CadastroClienteInput = z.infer<typeof cadastroClienteSchema>;
