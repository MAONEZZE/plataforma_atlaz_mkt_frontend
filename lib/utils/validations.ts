import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const metricaSchema = z.object({
  week_start: z.string().min(1, "Selecione a semana."),
  calls_scheduled: z.number().int().min(0, "Não pode ser negativo."),
  calls_made: z.number().int().min(0, "Não pode ser negativo."),
  meetings_scheduled: z.number().int().min(0, "Não pode ser negativo."),
  referrals: z.number().int().min(0, "Não pode ser negativo."),
});

export type MetricaFormInput = z.infer<typeof metricaSchema>;
