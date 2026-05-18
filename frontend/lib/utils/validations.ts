import { z } from "zod";

export const emailSchema = z.string().email("Email inválido.");

export const senhaSchema = z
  .string()
  .min(8, "Senha deve ter ao menos 8 caracteres.")
  .regex(/[A-Z]/, "Senha deve ter ao menos 1 letra maiúscula.")
  .regex(/[0-9]/, "Senha deve ter ao menos 1 número.");

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const metricaSchema = z.object({
  semana_inicio: z.string().min(1, "Selecione a semana."),
  ligacoes_agendadas: z.number().int().min(0, "Não pode ser negativo."),
  ligacoes_realizadas: z.number().int().min(0, "Não pode ser negativo."),
  reunioes_agendadas: z.number().int().min(0, "Não pode ser negativo."),
  indicacoes: z.number().int().min(0, "Não pode ser negativo."),
});

export type MetricaFormInput = z.infer<typeof metricaSchema>;
